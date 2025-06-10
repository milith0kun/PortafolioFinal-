/**
 * 🌐 CLIENTE API HTTP
 * Sistema Portafolio Docente UNSAAC
 * 
 * Cliente HTTP centralizado para comunicación con el backend
 * Maneja autenticación, errores, cache y métricas
 */

class ClienteAPI {
    constructor() {
        this.baseURL = CONFIG.API.API_PREFIX;
        this.timeout = CONFIG.API.TIMEOUT;
        this.maxReintentos = CONFIG.API.MAX_REINTENTOS;
        
        // Cache para respuestas
        this.cache = new Map();
        this.cacheMaxSize = CONFIG.PERFORMANCE.CACHE_SIZE_LIMIT;
        this.cacheDuration = CONFIG.PERFORMANCE.CACHE_DURATION;
        
        // Control de rate limiting
        this.requestQueue = [];
        this.requestCount = 0;
        this.lastResetTime = Date.now();
        
        // Headers por defecto
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        };
        
        // Interceptores
        this.interceptors = {
            request: [],
            response: []
        };
        
        this.inicializarInterceptores();
    }

    /**
     * 🔧 Inicializar interceptores por defecto
     */
    inicializarInterceptores() {
        // Interceptor de request - Agregar token automáticamente
        this.interceptors.request.push((config) => {
            const token = this.obtenerToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            
            // Rate limiting
            if (!this.verificarRateLimit()) {
                throw new Error('Demasiadas peticiones. Intenta más tarde.');
            }
            
            return config;
        });

        // Interceptor de response - Manejo de errores de auth
        this.interceptors.response.push(
            (response) => response, // Si es exitoso, devolver tal como está
            async (error) => {
                const originalRequest = error.config;
                
                // Si es 401 y no es el endpoint de login, intentar refresh
                if (error.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/login')) {
                    originalRequest._retry = true;
                    
                    try {
                        await this.refrescarToken();
                        // Reintentar petición original
                        return this.ejecutarPeticion(originalRequest);
                    } catch (refreshError) {
                        // Si falla el refresh, redirigir a login
                        this.manejarExpiracionSesion();
                        throw refreshError;
                    }
                }
                
                throw error;
            }
        );
    }

    /**
     * 🔑 Obtener token de autenticación
     */
    obtenerToken() {
        return localStorage.getItem(CONFIG.AUTH.TOKEN_KEY);
    }

    /**
     * 🔄 Refrescar token de autenticación
     */
    async refrescarToken() {
        const refreshToken = localStorage.getItem(CONFIG.AUTH.REFRESH_TOKEN_KEY);
        
        if (!refreshToken) {
            throw new Error('No hay token de actualización disponible');
        }

        try {
            const response = await this.post(CONFIG.AUTH.REFRESH_URL, {
                refreshToken: refreshToken
            }, { _skipInterceptors: true });

            // Guardar nuevos tokens
            localStorage.setItem(CONFIG.AUTH.TOKEN_KEY, response.data.token);
            if (response.data.refreshToken) {
                localStorage.setItem(CONFIG.AUTH.REFRESH_TOKEN_KEY, response.data.refreshToken);
            }

            return response.data.token;
        } catch (error) {
            // Limpiar tokens inválidos
            this.limpiarAutenticacion();
            throw error;
        }
    }

    /**
     * 🚪 Manejar expiración de sesión
     */
    manejarExpiracionSesion() {
        this.limpiarAutenticacion();
        
        // Mostrar notificación
        if (window.mostrarNotificacion) {
            window.mostrarNotificacion('Tu sesión ha expirado. Inicia sesión nuevamente.', 'warning');
        }
        
        // Redirigir a login después de un breve delay
        setTimeout(() => {
            window.location.href = '/paginas/autenticacion/login.html';
        }, 2000);
    }

    /**
     * 🧹 Limpiar datos de autenticación
     */
    limpiarAutenticacion() {
        localStorage.removeItem(CONFIG.AUTH.TOKEN_KEY);
        localStorage.removeItem(CONFIG.AUTH.REFRESH_TOKEN_KEY);
        localStorage.removeItem(CONFIG.AUTH.USER_KEY);
        localStorage.removeItem(CONFIG.AUTH.ROLE_KEY);
        this.limpiarCache();
    }

    /**
     * ⚡ Verificar rate limiting
     */
    verificarRateLimit() {
        const ahora = Date.now();
        const tiempoTranscurrido = ahora - this.lastResetTime;

        // Resetear contador cada minuto
        if (tiempoTranscurrido >= CONFIG.SEGURIDAD.RATE_LIMIT.WINDOW_MS) {
            this.requestCount = 0;
            this.lastResetTime = ahora;
        }

        // Verificar límite
        if (this.requestCount >= CONFIG.SEGURIDAD.RATE_LIMIT.MAX_REQUESTS) {
            return false;
        }

        this.requestCount++;
        return true;
    }

    /**
     * 💾 Gestión de cache
     */
    generarClaveCache(url, params = {}) {
        const paramsString = JSON.stringify(params);
        return `${url}?${paramsString}`;
    }

    obtenerCache(clave) {
        const cached = this.cache.get(clave);
        if (!cached) return null;

        const ahora = Date.now();
        if (ahora - cached.timestamp > this.cacheDuration) {
            this.cache.delete(clave);
            return null;
        }

        return cached.data;
    }

    guardarCache(clave, data) {
        // Limpiar cache si está lleno
        if (this.cache.size >= this.cacheMaxSize) {
            const primeraCllave = this.cache.keys().next().value;
            this.cache.delete(primeraCllave);
        }

        this.cache.set(clave, {
            data: data,
            timestamp: Date.now()
        });
    }

    limpiarCache() {
        this.cache.clear();
    }

    /**
     * 🔄 Ejecutar petición HTTP principal
     */
    async ejecutarPeticion(config) {
        try {
            // Aplicar interceptores de request
            for (const interceptor of this.interceptors.request) {
                config = await interceptor(config);
            }

            // Preparar URL completa
            const url = config.url.startsWith('http') ? config.url : `${this.baseURL}${config.url}`;
            
            // Configurar opciones de fetch
            const opciones = {
                method: config.method || 'GET',
                headers: { ...this.defaultHeaders, ...config.headers },
                signal: this.crearTimeoutSignal(config.timeout || this.timeout)
            };

            // Agregar body si es necesario
            if (config.data) {
                if (config.data instanceof FormData) {
                    delete opciones.headers['Content-Type']; // Dejar que el browser lo maneje
                    opciones.body = config.data;
                } else {
                    opciones.body = JSON.stringify(config.data);
                }
            }

            // Ejecutar petición
            const response = await fetch(url, opciones);
            
            // Verificar si la respuesta es exitosa
            if (!response.ok) {
                const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
                error.status = response.status;
                error.config = config;
                throw error;
            }

            // Parsear respuesta
            let data;
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else if (contentType && contentType.includes('text/')) {
                data = await response.text();
            } else {
                data = await response.blob();
            }

            const resultado = {
                data: data,
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
                config: config
            };

            // Aplicar interceptores de response
            let finalResult = resultado;
            for (const interceptor of this.interceptors.response) {
                finalResult = await interceptor[0](finalResult);
            }

            return finalResult;

        } catch (error) {
            // Aplicar interceptores de error
            for (const interceptor of this.interceptors.response) {
                if (interceptor[1]) {
                    try {
                        return await interceptor[1](error);
                    } catch (interceptorError) {
                        error = interceptorError;
                    }
                }
            }

            // Manejo de errores con reintentos
            if (config._reintentos < this.maxReintentos && this.debeReintentar(error)) {
                config._reintentos = (config._reintentos || 0) + 1;
                
                // Delay exponencial
                const delay = Math.pow(2, config._reintentos) * 1000;
                await this.esperar(delay);
                
                return this.ejecutarPeticion(config);
            }

            throw this.procesarError(error);
        }
    }

    /**
     * ⏱️ Crear signal para timeout
     */
    crearTimeoutSignal(timeout) {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), timeout);
        return controller.signal;
    }

    /**
     * 🔄 Verificar si debe reintentar
     */
    debeReintentar(error) {
        // Reintentar solo en errores de red o 5xx
        return !error.status || error.status >= 500;
    }

    /**
     * ⏳ Función de espera
     */
    esperar(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 🚨 Procesar errores
     */
    procesarError(error) {
        const errorProcesado = {
            message: error.message || 'Error desconocido',
            status: error.status || 0,
            tipo: this.determinarTipoError(error),
            timestamp: new Date().toISOString(),
            config: error.config
        };

        // Log del error en desarrollo
        if (CONFIG.ENTORNO.desarrollo) {
            console.error('🚨 Error de API:', errorProcesado);
        }

        // Enviar métricas de error
        if (CONFIG.METRICAS.TRACKING_HABILITADO) {
            this.enviarMetricaError(errorProcesado);
        }

        return errorProcesado;
    }

    /**
     * 🔍 Determinar tipo de error
     */
    determinarTipoError(error) {
        if (!error.status) return CONFIG.ERRORES.TIPOS.NETWORK;
        if (error.status === 401 || error.status === 403) return CONFIG.ERRORES.TIPOS.AUTH;
        if (error.status >= 400 && error.status < 500) return CONFIG.ERRORES.TIPOS.VALIDATION;
        if (error.status >= 500) return CONFIG.ERRORES.TIPOS.SERVER;
        return CONFIG.ERRORES.TIPOS.CLIENT;
    }

    /**
     * 📊 Enviar métrica de error
     */
    enviarMetricaError(error) {
        // Implementar envío de métricas según necesidades
        if (window.gtag) {
            window.gtag('event', 'api_error', {
                error_type: error.tipo,
                error_status: error.status,
                error_message: error.message
            });
        }
    }

    // ==========================================
    // 🎯 MÉTODOS HTTP PRINCIPALES
    // ==========================================

    /**
     * 📥 GET Request
     */
    async get(url, params = {}, config = {}) {
        // Verificar cache para GET
        if (!config.skipCache) {
            const claveCache = this.generarClaveCache(url, params);
            const cached = this.obtenerCache(claveCache);
            if (cached) return { data: cached };
        }

        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;

        const resultado = await this.ejecutarPeticion({
            method: 'GET',
            url: fullUrl,
            ...config
        });

        // Guardar en cache
        if (!config.skipCache && resultado.data) {
            const claveCache = this.generarClaveCache(url, params);
            this.guardarCache(claveCache, resultado.data);
        }

        return resultado;
    }

    /**
     * 📤 POST Request
     */
    async post(url, data = {}, config = {}) {
        return this.ejecutarPeticion({
            method: 'POST',
            url: url,
            data: data,
            ...config
        });
    }

    /**
     * ✏️ PUT Request
     */
    async put(url, data = {}, config = {}) {
        return this.ejecutarPeticion({
            method: 'PUT',
            url: url,
            data: data,
            ...config
        });
    }

    /**
     * 🔧 PATCH Request
     */
    async patch(url, data = {}, config = {}) {
        return this.ejecutarPeticion({
            method: 'PATCH',
            url: url,
            data: data,
            ...config
        });
    }

    /**
     * 🗑️ DELETE Request
     */
    async delete(url, config = {}) {
        return this.ejecutarPeticion({
            method: 'DELETE',
            url: url,
            ...config
        });
    }

    /**
     * 📁 Upload de archivos
     */
    async subirArchivo(url, archivo, datosAdicionales = {}, onProgress = null) {
        const formData = new FormData();
        formData.append('archivo', archivo);
        
        // Agregar datos adicionales
        Object.keys(datosAdicionales).forEach(key => {
            formData.append(key, datosAdicionales[key]);
        });

        const config = {
            headers: {
                // No establecer Content-Type para FormData
            }
        };

        // Implementar progress si se proporciona callback
        if (onProgress && typeof onProgress === 'function') {
            // Nota: fetch API no soporta nativamente progress upload
            // Para progress real se necesitaría XMLHttpRequest
            onProgress({ loaded: 0, total: archivo.size, percent: 0 });
        }

        const resultado = await this.post(url, formData, config);

        if (onProgress) {
            onProgress({ loaded: archivo.size, total: archivo.size, percent: 100 });
        }

        return resultado;
    }

    /**
     * 📊 Subida con progress real usando XMLHttpRequest
     */
    async subirArchivoConProgress(url, archivo, datosAdicionales = {}, onProgress = null) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const formData = new FormData();
            
            formData.append('archivo', archivo);
            Object.keys(datosAdicionales).forEach(key => {
                formData.append(key, datosAdicionales[key]);
            });

            // Configurar progress
            if (onProgress) {
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const percent = Math.round((e.loaded / e.total) * 100);
                        onProgress({
                            loaded: e.loaded,
                            total: e.total,
                            percent: percent
                        });
                    }
                });
            }

            // Configurar respuesta
            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve({ data: response, status: xhr.status });
                    } catch (e) {
                        resolve({ data: xhr.responseText, status: xhr.status });
                    }
                } else {
                    reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Error de red durante la subida'));
            });

            // Configurar headers
            const token = this.obtenerToken();
            if (token) {
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }

            // Enviar petición
            const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
            xhr.open('POST', fullUrl);
            xhr.send(formData);
        });
    }

    /**
     * 📥 Descargar archivo
     */
    async descargarArchivo(url, nombreArchivo = null) {
        try {
            const response = await this.ejecutarPeticion({
                method: 'GET',
                url: url,
                headers: {
                    'Accept': '*/*'
                }
            });

            // Crear blob y descargar
            const blob = new Blob([response.data]);
            const urlDescarga = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = urlDescarga;
            link.download = nombreArchivo || 'archivo_descargado';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            window.URL.revokeObjectURL(urlDescarga);
            
            return response;
        } catch (error) {
            throw this.procesarError(error);
        }
    }

    // ==========================================
    // 🛠️ MÉTODOS UTILITARIOS
    // ==========================================

    /**
     * 🏥 Health check
     */
    async verificarSalud() {
        try {
            const response = await this.get('/health', {}, { skipCache: true });
            return response.data;
        } catch (error) {
            return { status: 'error', message: error.message };
        }
    }

    /**
     * 📊 Obtener estadísticas de la instancia API
     */
    obtenerEstadisticas() {
        return {
            cacheSize: this.cache.size,
            requestCount: this.requestCount,
            lastResetTime: this.lastResetTime,
            interceptorsCount: {
                request: this.interceptors.request.length,
                response: this.interceptors.response.length
            }
        };
    }

    /**
     * 🔧 Agregar interceptor personalizado
     */
    agregarInterceptor(tipo, fn) {
        if (tipo === 'request' || tipo === 'response') {
            this.interceptors[tipo].push(fn);
        }
    }
}

// 🚀 Crear instancia global
window.api = new ClienteAPI();

// 📤 Exportar para módulos ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ClienteAPI;
}

// 🔄 Auto-refresh de token en background
if (CONFIG.AUTH.AUTO_REFRESH) {
    setInterval(async () => {
        const token = window.api.obtenerToken();
        if (token) {
            try {
                // Verificar si el token expira pronto
                const tokenData = JSON.parse(atob(token.split('.')[1]));
                const expTime = tokenData.exp * 1000;
                const ahora = Date.now();
                const tiempoRestante = expTime - ahora;
                const tiempoRefresh = CONFIG.AUTH.REFRESH_BEFORE_EXPIRE * 60 * 1000;

                if (tiempoRestante <= tiempoRefresh && tiempoRestante > 0) {
                    await window.api.refrescarToken();
                }
            } catch (error) {
                console.warn('Error al verificar expiración de token:', error);
            }
        }
    }, 60000); // Verificar cada minuto
}

console.log('🌐 Cliente API inicializado correctamente');