/**
 * 📋 Obtener configuración del ciclo
 * GET /api/v1/ciclos/:id/configuracion
 */
async function obtenerConfiguracionCiclo(req, res) {
    try {
        const { id } = req.params;
        const { incluir_herencia = true, incluir_plantillas = false } = req.query;

        // Verificar que el ciclo existe
        const sqlVerificarCiclo = `
            SELECT ca.*, CONCAT(u.nombres, ' ', u.apellidos) as creado_por_nombre
            FROM ciclos_academicos ca
            INNER JOIN usuarios u ON ca.creado_por = u.id
            WHERE ca.id = ?
        `;
        const { resultado: ciclo } = await poolConexion.ejecutarLectura(sqlVerificarCiclo, [id]);

        if (ciclo.length === 0) {
            return res.status(404).json({
                exito: false,
                mensaje: 'Ciclo académico no encontrado',
                timestamp: new Date().toISOString()
            });
        }

        // Obtener configuración específica del ciclo
        const sqlConfiguracion = `
            SELECT * FROM configuraciones_ciclo 
            WHERE ciclo_id = ? AND activo = 1
            ORDER BY fecha_creacion DESC
            LIMIT 1
        `;
        const { resultado: configuracionCiclo } = await poolConexion.ejecutarLectura(sqlConfiguracion, [id]);

        let configuracionActual = null;
        let configuracionHeredada = null;

        if (configuracionCiclo.length > 0) {
            configuracionActual = configuracionCiclo[0];
        }

        // Obtener configuración heredada si se solicita y no hay configuración específica
        if (incluir_herencia === 'true' && (!configuracionActual || configuracionActual.hereda_configuracion)) {
            configuracionHeredada = await obtenerConfiguracionHeredada(id);
        }

        // Combinar configuraciones (específica tiene prioridad sobre heredada)
        const configuracionFinal = combinarConfiguraciones(configuracionActual, configuracionHeredada);

        // Obtener estructura de portafolio asociada
        let estructuraPortafolio = null;
        if (configuracionFinal.estructura_portafolio_id) {
            const sqlEstructura = `
                SELECT * FROM estructura_portafolio_base 
                WHERE id = ? AND activo = 1
            `;
            const { resultado: estructura } = await poolConexion.ejecutarLectura(sqlEstructura, [configuracionFinal.estructura_portafolio_id]);
            estructuraPortafolio = estructura[0] || null;
        }

        // Obtener plantillas disponibles si se solicita
        let plantillasDisponibles = [];
        if (incluir_plantillas === 'true') {
            plantillasDisponibles = await obtenerPlantillasConfiguracion();
        }

        // Formatear fechas
        const configuracionFormateada = {
            ...configuracionFinal,
            fecha_limite_subida: configuracionFinal.fecha_limite_subida ? 
                moment(configuracionFinal.fecha_limite_subida).format('YYYY-MM-DD') : null,
            fecha_limite_verificacion: configuracionFinal.fecha_limite_verificacion ? 
                moment(configuracionFinal.fecha_limite_verificacion).format('YYYY-MM-DD') : null,
            fecha_creacion: configuracionFinal.fecha_creacion ? 
                moment(configuracionFinal.fecha_creacion).format('DD/MM/YYYY HH:mm:ss') : null,
            fecha_actualizacion: configuracionFinal.fecha_actualizacion ? 
                moment(configuracionFinal.fecha_actualizacion).format('DD/MM/YYYY HH:mm:ss') : null,
            configuraciones_adicionales: configuracionFinal.configuraciones_adicionales ? 
                JSON.parse(configuracionFinal.configuraciones_adicionales) : {}
        };

        res.json({
            exito: true,
            mensaje: 'Configuración del ciclo obtenida exitosamente',
            datos: {
                ciclo: {
                    ...ciclo[0],
                    fecha_inicio: moment(ciclo[0].fecha_inicio).format('YYYY-MM-DD'),
                    fecha_fin: moment(ciclo[0].fecha_fin).format('YYYY-MM-DD')
                },
                configuracion: configuracionFormateada,
                estructura_portafolio: estructuraPortafolio,
                origen_configuracion: {
                    tiene_configuracion_especifica: configuracionActual !== null,
                    hereda_configuracion: configuracionHeredada !== null,
                    origen: configuracionActual ? 'especifica' : 'heredada'
                },
                plantillas_disponibles: plantillasDisponibles,
                validacion: await validarConfiguracionActual(configuracionFormateada)
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error al obtener configuración del ciclo:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * 📝 Actualizar configuración del ciclo
 * PUT /api/v1/ciclos/:id/configuracion
 */
async function actualizarConfiguracionCiclo(req, res) {
    try {
        const { id } = req.params;
        const usuario_id = req.usuario.id;

        // Validar datos de entrada
        const { error, value } = esquemaConfiguracion.validate(req.body);
        
        if (error) {
            return res.status(400).json({
                exito: false,
                mensaje: 'Datos de configuración inválidos',
                errores: error.details.map(e => e.message),
                timestamp: new Date().toISOString()
            });
        }

        const nuevaConfiguracion = value;

        // Verificar que el ciclo existe y puede ser configurado
        const sqlVerificarCiclo = 'SELECT * FROM ciclos_academicos WHERE id = ?';
        const { resultado: ciclo } = await poolConexion.ejecutarLectura(sqlVerificarCiclo, [id]);

        if (ciclo.length === 0) {
            return res.status(404).json({
                exito: false,
                mensaje: 'Ciclo académico no encontrado',
                timestamp: new Date().toISOString()
            });
        }

        // Verificar que el ciclo no está archivado
        if (ciclo[0].estado === 'archivado') {
            return res.status(403).json({
                exito: false,
                mensaje: 'No se puede modificar la configuración de un ciclo archivado',
                estado_actual: ciclo[0].estado,
                timestamp: new Date().toISOString()
            });
        }

        // Validaciones específicas
        const validacionEspecifica = await validarConfiguracionEspecifica(id, nuevaConfiguracion, ciclo[0]);
        if (!validacionEspecifica.esValida) {
            return res.status(400).json({
                exito: false,
                mensaje: 'Configuración inválida',
                errores_validacion: validacionEspecifica.errores,
                timestamp: new Date().toISOString()
            });
        }

        // Verificar si ya existe configuración para este ciclo
        const sqlConfiguracionExistente = 'SELECT * FROM configuraciones_ciclo WHERE ciclo_id = ? AND activo = 1';
        const { resultado: configuracionExistente } = await poolConexion.ejecutarLectura(sqlConfiguracionExistente, [id]);

        // Preparar datos para inserción/actualización
        const datosConfiguracion = {
            ...nuevaConfiguracion,
            configuraciones_adicionales: JSON.stringify(nuevaConfiguracion.configuraciones_adicionales),
            fecha_limite_subida: nuevaConfiguracion.fecha_limite_subida ? 
                moment(nuevaConfiguracion.fecha_limite_subida).format('YYYY-MM-DD') : null,
            fecha_limite_verificacion: nuevaConfiguracion.fecha_limite_verificacion ? 
                moment(nuevaConfiguracion.fecha_limite_verificacion).format('YYYY-MM-DD') : null
        };

        let configuracionId;

        await poolConexion.ejecutarTransaccionCompleja(async (conexion) => {
            if (configuracionExistente.length > 0) {
                // Actualizar configuración existente
                configuracionId = configuracionExistente[0].id;
                
                const camposActualizar = Object.keys(datosConfiguracion)
                    .map(campo => `${campo} = ?`)
                    .join(', ');
                
                const sqlActualizar = `
                    UPDATE configuraciones_ciclo 
                    SET ${camposActualizar}, fecha_actualizacion = CURRENT_TIMESTAMP, actualizado_por = ?
                    WHERE id = ?
                `;
                
                const valores = [...Object.values(datosConfiguracion), usuario_id, configuracionId];
                await conexion.execute(sqlActualizar, valores);
                
            } else {
                // Crear nueva configuración
                const campos = Object.keys(datosConfiguracion).join(', ');
                const placeholders = Object.keys(datosConfiguracion).map(() => '?').join(', ');
                
                const sqlInsertar = `
                    INSERT INTO configuraciones_ciclo (
                        ciclo_id, ${campos}, creado_por, fecha_creacion
                    ) VALUES (?, ${placeholders}, ?, CURRENT_TIMESTAMP)
                `;
                
                const valores = [id, ...Object.values(datosConfiguracion), usuario_id];
                const resultado = await conexion.execute(sqlInsertar, valores);
                configuracionId = resultado.insertId;
            }

            // Registrar acción en auditoría
            await conexion.execute(`
                INSERT INTO acciones_admin (
                    usuario_id, accion, entidad_tipo, entidad_id, 
                    detalles, fecha_accion
                ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `, [
                usuario_id,
                configuracionExistente.length > 0 ? 'actualizar_configuracion_ciclo' : 'crear_configuracion_ciclo',
                'configuracion_ciclo',
                configuracionId,
                JSON.stringify({
                    ciclo_id: id,
                    cambios: nuevaConfiguracion,
                    accion: configuracionExistente.length > 0 ? 'actualizacion' : 'creacion'
                })
            ]);
        });

        // Aplicar configuración a elementos existentes si es necesario
        await aplicarConfiguracionAElementosExistentes(id, nuevaConfiguracion);

        // Obtener configuración actualizada completa
        const configuracionActualizada = await obtenerConfiguracionCompleta(id);

        res.json({
            exito: true,
            mensaje: 'Configuración del ciclo actualizada exitosamente',
            datos: configuracionActualizada,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error al actualizar configuración del ciclo:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * 📄 Copiar configuración de otro ciclo
 * POST /api/v1/ciclos/:id/configuracion/copiar
 */
async function copiarConfiguracionCiclo(req, res) {
    try {
        const { id } = req.params;
        const usuario_id = req.usuario.id;

        // Validar datos de entrada
        const { error, value } = esquemaCopiarConfiguracion.validate(req.body);
        
        if (error) {
            return res.status(400).json({
                exito: false,
                mensaje: 'Datos para copia inválidos',
                errores: error.details.map(e => e.message),
                timestamp: new Date().toISOString()
            });
        }

        const {
            ciclo_origen_id,
            copiar_estructura,
            copiar_fechas_limite,
            copiar_configuraciones_archivos,
            copiar_configuraciones_evaluacion,
            copiar_notificaciones,
            ajustar_fechas_automaticamente
        } = value;

        // Verificar que ambos ciclos existen
        const sqlVerificarCiclos = `
            SELECT id, nombre, estado, fecha_inicio, fecha_fin 
            FROM ciclos_academicos 
            WHERE id IN (?, ?)
        `;
        const { resultado: ciclos } = await poolConexion.ejecutarLectura(sqlVerificarCiclos, [id, ciclo_origen_id]);

        if (ciclos.length !== 2) {
            return res.status(404).json({
                exito: false,
                mensaje: 'Uno o ambos ciclos no encontrados',
                timestamp: new Date().toISOString()
            });
        }

        const cicloDestino = ciclos.find(c => c.id == id);
        const cicloOrigen = ciclos.find(c => c.id == ciclo_origen_id);

        // Verificar que el ciclo destino puede ser configurado
        if (cicloDestino.estado === 'archivado') {
            return res.status(403).json({
                exito: false,
                mensaje: 'No se puede copiar configuración a un ciclo archivado',
                timestamp: new Date().toISOString()
            });
        }

        // Obtener configuración del ciclo origen
        const sqlConfiguracionOrigen = `
            SELECT * FROM configuraciones_ciclo 
            WHERE ciclo_id = ? AND activo = 1
            ORDER BY fecha_creacion DESC
            LIMIT 1
        `;
        const { resultado: configuracionOrigen } = await poolConexion.ejecutarLectura(sqlConfiguracionOrigen, [ciclo_origen_id]);

        if (configuracionOrigen.length === 0) {
            return res.status(404).json({
                exito: false,
                mensaje: 'El ciclo origen no tiene configuración para copiar',
                ciclo_origen: cicloOrigen.nombre,
                timestamp: new Date().toISOString()
            });
        }

        const configOrigen = configuracionOrigen[0];

        // Preparar nueva configuración basada en filtros de copia
        const nuevaConfiguracion = prepararConfiguracionCopiada(
            configOrigen,
            cicloDestino,
            cicloOrigen,
            {
                copiar_estructura,
                copiar_fechas_limite,
                copiar_configuraciones_archivos,
                copiar_configuraciones_evaluacion,
                copiar_notificaciones,
                ajustar_fechas_automaticamente
            }
        );

        // Desactivar configuración existente del ciclo destino y crear nueva
        await poolConexion.ejecutarTransaccionCompleja(async (conexion) => {
            // Desactivar configuración existente
            await conexion.execute(
                'UPDATE configuraciones_ciclo SET activo = 0 WHERE ciclo_id = ?',
                [id]
            );

            // Insertar nueva configuración
            const campos = Object.keys(nuevaConfiguracion).join(', ');
            const placeholders = Object.keys(nuevaConfiguracion).map(() => '?').join(', ');
            
            const sqlInsertar = `
                INSERT INTO configuraciones_ciclo (
                    ciclo_id, ${campos}, creado_por, fecha_creacion, 
                    observaciones, origen_copia
                ) VALUES (?, ${placeholders}, ?, CURRENT_TIMESTAMP, ?, ?)
            `;
            
            const valores = [
                id, 
                ...Object.values(nuevaConfiguracion), 
                usuario_id,
                `Configuración copiada del ciclo: ${cicloOrigen.nombre}`,
                ciclo_origen_id
            ];
            
            await conexion.execute(sqlInsertar, valores);

            // Registrar acción en auditoría
            await conexion.execute(`
                INSERT INTO acciones_admin (
                    usuario_id, accion, entidad_tipo, entidad_id, 
                    detalles, fecha_accion
                ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `, [
                usuario_id,
                'copiar_configuracion_ciclo',
                'configuracion_ciclo',
                id,
                JSON.stringify({
                    ciclo_destino_id: id,
                    ciclo_origen_id,
                    filtros_copia: {
                        copiar_estructura,
                        copiar_fechas_limite,
                        copiar_configuraciones_archivos,
                        copiar_configuraciones_evaluacion,
                        copiar_notificaciones,
                        ajustar_fechas_automaticamente
                    }
                })
            ]);
        });

        // Obtener configuración copiada completa
        const configuracionCopiada = await obtenerConfiguracionCompleta(id);

        res.json({
            exito: true,
            mensaje: 'Configuración copiada exitosamente',
            datos: {
                configuracion_copiada: configuracionCopiada,
                origen: {
                    ciclo_id: ciclo_origen_id,
                    ciclo_nombre: cicloOrigen.nombre
                },
                destino: {
                    ciclo_id: id,
                    ciclo_nombre: cicloDestino.nombre
                },
                elementos_copiados: {
                    estructura: copiar_estructura,
                    fechas_limite: copiar_fechas_limite,
                    configuraciones_archivos: copiar_configuraciones_archivos,
                    configuraciones_evaluacion: copiar_configuraciones_evaluacion,
                    notificaciones: copiar_notificaciones
                },
                fechas_ajustadas: ajustar_fechas_automaticamente
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error al copiar configuración del ciclo:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * 🔄 Resetear configuración a valores por defecto
 * DELETE /api/v1/ciclos/:id/configuracion/resetear
 */
async function resetearConfiguracionCiclo(req, res) {
    try {
        const { id } = req.params;
        const { confirmar = false } = req.body;
        const usuario_id = req.usuario.id;

        // Verificar que el ciclo existe
        const sqlVerificarCiclo = 'SELECT * FROM ciclos_academicos WHERE id = ?';
        const { resultado: ciclo } = await poolConexion.ejecutarLectura(sqlVerificarCiclo, [id]);

        if (ciclo.length === 0) {
            return res.status(404).json({
                exito: false,
                mensaje: 'Ciclo académico no encontrado',
                timestamp: new Date().toISOString()
            });
        }

        // Verificar que el ciclo puede ser modificado
        if (ciclo[0].estado === 'archivado') {
            return res.status(403).json({
                exito: false,
                mensaje: 'No se puede resetear la configuración de un ciclo archivado',
                timestamp: new Date().toISOString()
            });
        }

        // Obtener configuración actual
        const sqlConfiguracionActual = `
            SELECT * FROM configuraciones_ciclo 
            WHERE ciclo_id = ? AND activo = 1
        `;
        const { resultado: configuracionActual } = await poolConexion.ejecutarLectura(sqlConfiguracionActual, [id]);

        if (configuracionActual.length === 0) {
            return res.status(404).json({
                exito: false,
                mensaje: 'No hay configuración específica para resetear',
                recomendacion: 'El ciclo ya usa la configuración por defecto',
                timestamp: new Date().toISOString()
            });
        }

        // Solicitar confirmación si no se proporcionó
        if (!confirmar) {
            return res.status(400).json({
                exito: false,
                mensaje: 'Se requiere confirmación para resetear la configuración',
                configuracion_actual: {
                    id: configuracionActual[0].id,
                    fecha_creacion: moment(configuracionActual[0].fecha_creacion).format('DD/MM/YYYY HH:mm:ss'),
                    personalizada: true
                },
                advertencia: 'Esta acción eliminará toda la configuración personalizada del ciclo',
                solucion: 'Envíe "confirmar: true" para proceder con el reseteo',
                timestamp: new Date().toISOString()
            });
        }

        // Respaldar configuración actual antes de eliminar
        const respaldoConfiguracion = {
            ...configuracionActual[0],
            fecha_respaldo: moment().format('YYYY-MM-DD HH:mm:ss')
        };

        await poolConexion.ejecutarTransaccionCompleja(async (conexion) => {
            // Desactivar configuración actual
            await conexion.execute(
                'UPDATE configuraciones_ciclo SET activo = 0, fecha_eliminacion = CURRENT_TIMESTAMP WHERE ciclo_id = ?',
                [id]
            );

            // Crear respaldo en tabla de historiales
            await conexion.execute(`
                INSERT INTO historiales_configuracion (
                    ciclo_id, configuracion_respaldada, motivo_respaldo, 
                    respaldado_por, fecha_respaldo
                ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            `, [
                id,
                JSON.stringify(respaldoConfiguracion),
                'Reseteo a configuración por defecto',
                usuario_id
            ]);

            // Registrar acción en auditoría
            await conexion.execute(`
                INSERT INTO acciones_admin (
                    usuario_id, accion, entidad_tipo, entidad_id, 
                    detalles, fecha_accion
                ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `, [
                usuario_id,
                'resetear_configuracion_ciclo',
                'configuracion_ciclo',
                id,
                JSON.stringify({
                    ciclo_id: id,
                    configuracion_eliminada: configuracionActual[0].id,
                    motivo: 'reseteo_a_defecto'
                })
            ]);
        });

        // Obtener configuración por defecto (heredada)
        const configuracionPorDefecto = await obtenerConfiguracionHeredada(id);

        res.json({
            exito: true,
            mensaje: 'Configuración del ciclo reseteada exitosamente',
            datos: {
                configuracion_actual: configuracionPorDefecto,
                configuracion_eliminada: {
                    id: configuracionActual[0].id,
                    fecha_creacion: moment(configuracionActual[0].fecha_creacion).format('DD/MM/YYYY HH:mm:ss'),
                    respaldada: true
                },
                configuracion_por_defecto: {
                    activa: true,
                    origen: 'herencia_sistema',
                    descripcion: 'Configuración estándar del sistema'
                }
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error al resetear configuración del ciclo:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * 📋 Obtener plantillas de configuración disponibles
 * GET /api/v1/ciclos/:id/configuracion/plantillas
 */
async function obtenerPlantillasConfiguracion(req, res) {
    try {
        const { id } = req.params;
        const { incluir_descripcion = true, filtrar_por_carrera = false } = req.query;

        // Verificar que el ciclo existe
        const sqlVerificarCiclo = 'SELECT * FROM ciclos_academicos WHERE id = ?';
        const { resultado: ciclo } = await poolConexion.ejecutarLectura(sqlVerificarCiclo, [id]);

        if (ciclo.length === 0) {
            return res.status(404).json({
                exito: false,
                mensaje: 'Ciclo académico no encontrado',
                timestamp: new Date().toISOString()
            });
        }

        // Obtener plantillas de configuración disponibles
        let sqlPlantillas = `
            SELECT 
                pt.*,
                COUNT(cc.id) as veces_utilizada,
                GROUP_CONCAT(DISTINCT ca.nombre ORDER BY ca.fecha_creacion DESC SEPARATOR ', ') as ciclos_utilizados
            FROM plantillas_configuracion pt
            LEFT JOIN configuraciones_ciclo cc ON pt.id = cc.plantilla_id
            LEFT JOIN ciclos_academicos ca ON cc.ciclo_id = ca.id
            WHERE pt.activa = 1
        `;

        let parametros = [];

        if (filtrar_por_carrera === 'true') {
            // Obtener carreras del ciclo actual para filtrar plantillas
            const sqlCarrerasCiclo = `
                SELECT DISTINCT a.carrera
                FROM docentes_asignaturas da
                INNER JOIN asignaturas a ON da.asignatura_id = a.id
                WHERE da.ciclo_id = ?
            `;
            const { resultado: carreras } = await poolConexion.ejecutarLectura(sqlCarrerasCiclo, [id]);
            
            if (carreras.length > 0) {
                const carrerasLista = carreras.map(c => `'${c.carrera}'`).join(',');
                sqlPlantillas += ` AND (pt.carreras_aplicables IS NULL OR pt.carreras_aplicables REGEXP '${carreras.map(c => c.carrera).join('|')}')`;
            }
        }

        sqlPlantillas += ` 
            GROUP BY pt.id
            ORDER BY pt.nombre ASC
        `;

        const { resultado: plantillas } = await poolConexion.ejecutarLectura(sqlPlantillas, parametros);

        // Formatear plantillas con información adicional
        const plantillasFormateadas = await Promise.all(plantillas.map(async (plantilla) => {
            let configuracionDetalle = {};
            
            if (incluir_descripcion === 'true') {
                configuracionDetalle = plantilla.configuracion_json ? 
                    JSON.parse(plantilla.configuracion_json) : {};
            }

            return {
                ...plantilla,
                configuracion_json: plantilla.configuracion_json ? 
                    JSON.parse(plantilla.configuracion_json) : {},
                carreras_aplicables: plantilla.carreras_aplicables ? 
                    plantilla.carreras_aplicables.split(',') : [],
                fecha_creacion: moment(plantilla.fecha_creacion).format('DD/MM/YYYY HH:mm:ss'),
                fecha_actualizacion: plantilla.fecha_actualizacion ? 
                    moment(plantilla.fecha_actualizacion).format('DD/MM/YYYY HH:mm:ss') : null,
                estadisticas_uso: {
                    veces_utilizada: parseInt(plantilla.veces_utilizada),
                    ciclos_utilizados: plantilla.ciclos_utilizados ? 
                        plantilla.ciclos_utilizados.split(', ') : []
                },
                compatible_con_ciclo: await verificarCompatibilidadPlantilla(plantilla.id, id),
                configuracion_detalle: configuracionDetalle
            };
        }));

        // Obtener plantilla por defecto del sistema
        const plantillaPorDefecto = await obtenerPlantillaPorDefecto();

        res.json({
            exito: true,
            mensaje: 'Plantillas de configuración obtenidas exitosamente',
            datos: {
                ciclo: {
                    id: ciclo[0].id,
                    nombre: ciclo[0].nombre,
                    estado: ciclo[0].estado
                },
                plantillas_disponibles: plantillasFormateadas,
                plantilla_por_defecto: plantillaPorDefecto,
                total_plantillas: plantillasFormateadas.length,
                recomendaciones: await obtenerRecomendacionesPlantillas(id)
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error al obtener plantillas de configuración:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * ✅ Validar configuración del ciclo
 * POST /api/v1/ciclos/:id/configuracion/validar
 */
async function validarConfiguracionCiclo(req, res) {
    try {
        const { id } = req.params;
        const { validacion_profunda = true, incluir_sugerencias = true } = req.query;

        // Verificar que el ciclo existe
        const sqlVerificarCiclo = 'SELECT * FROM ciclos_academicos WHERE id = ?';
        const { resultado: ciclo } = await poolConexion.ejecutarLectura(sqlVerificarCiclo, [id]);

        if (ciclo.length === 0) {
            return res.status(404).json({
                exito: false,
                mensaje: 'Ciclo académico no encontrado',
                timestamp: new Date().toISOString()
            });
        }

        // Obtener configuración actual del ciclo
        const configuracionActual = await obtenerConfiguracionCompleta(id);

        if (!configuracionActual) {
            return res.status(404).json({
                exito: false,
                mensaje: 'No se encontró configuración para el ciclo',
                timestamp: new Date().toISOString()
            });
        }

        // Realizar validaciones
        const resultadosValidacion = {
            configuracion_valida: true,
            errores: [],
            advertencias: [],
            informacion: [],
            sugerencias: []
        };

        // Validaciones básicas
        await validarConfiguracionBasica(configuracionActual, resultadosValidacion);

        // Validaciones de fechas
        await validarFechasConfiguracion(configuracionActual, ciclo[0], resultadosValidacion);

        // Validaciones de archivos
        await validarConfiguracionArchivos(configuracionActual, resultadosValidacion);

        // Validaciones de evaluación
        await validarConfiguracionEvaluacion(configuracionActual, resultadosValidacion/**
 * ⚙️ CONTROLADOR DE CONFIGURACIÓN DE CICLOS
 * 
 * Maneja configuraciones específicas por ciclo académico:
 * - Estructura de portafolios por ciclo
 * - Fechas límite de entrega
 * - Configuraciones de evaluación
 * - Templates de documentos
 * - Notificaciones automáticas
 * 
 * Rutas que maneja:
 * GET /api/v1/ciclos/:id/configuracion - Obtener configuración
 * PUT /api/v1/ciclos/:id/configuracion - Actualizar configuración
 * POST /api/v1/ciclos/:id/configuracion/copiar - Copiar configuración de otro ciclo
 * DELETE /api/v1/ciclos/:id/configuracion/resetear - Resetear a configuración por defecto
 * GET /api/v1/ciclos/:id/configuracion/plantillas - Obtener plantillas disponibles
 * POST /api/v1/ciclos/:id/configuracion/validar - Validar configuración
 * 
 * @author Sistema Portafolio Docente UNSAAC
 * @version 1.0.0
 */

const poolConexion = require('../../base_datos/conexiones/pool.conexion');
const moment = require('moment');
const Joi = require('joi');

// ==========================================
// 📋 ESQUEMAS DE VALIDACIÓN
// ==========================================

const esquemaConfiguracion = Joi.object({
    // Configuraciones generales
    estructura_portafolio_id: Joi.number().integer().positive(),
    requiere_verificacion_obligatoria: Joi.boolean().default(true),
    permite_subida_multiple: Joi.boolean().default(true),
    notificaciones_automaticas: Joi.boolean().default(true),
    
    // Fechas límite
    fecha_limite_subida: Joi.date().allow(null),
    fecha_limite_verificacion: Joi.date().allow(null),
    dias_previos_notificacion: Joi.number().integer().min(1).max(30).default(7),
    
    // Configuraciones de archivos
    tamaño_maximo_archivo_mb: Joi.number().integer().min(1).max(100).default(10),
    formatos_permitidos: Joi.string().default('pdf,docx,xlsx,pptx,jpg,png'),
    max_archivos_por_carpeta: Joi.number().integer().min(1).max(50).default(20),
    
    // Configuraciones de evaluación
    calificacion_minima_aprobacion: Joi.number().min(0).max(20).default(14),
    permite_resubida_documentos: Joi.boolean().default(true),
    max_intentos_subida: Joi.number().integer().min(1).max(10).default(3),
    
    // Configuraciones de notificaciones
    notificar_subida_docente: Joi.boolean().default(true),
    notificar_verificacion_docente: Joi.boolean().default(true),
    notificar_observaciones: Joi.boolean().default(true),
    notificar_vencimientos: Joi.boolean().default(true),
    
    // Configuraciones personalizadas (JSON)
    configuraciones_adicionales: Joi.object().default({})
});

const esquemaCopiarConfiguracion = Joi.object({
    ciclo_origen_id: Joi.number().integer().positive().required(),
    copiar_estructura: Joi.boolean().default(true),
    copiar_fechas_limite: Joi.boolean().default(false),
    copiar_configuraciones_archivos: Joi.boolean().default(true),
    copiar_configuraciones_evaluacion: Joi.boolean().default(true),
    copiar_notificaciones: Joi.boolean().default(true),
    ajustar_fechas_automaticamente: Joi.boolean().default(true)
});
