// 📁 /react-panel/src/mock/arbolEjemplo.js
export const ejemploEstructura = [
  {
    nombre_semestre: '2025-I',
    docentes: [
      {
        nombre_docente: 'Alberto Cutipa',
        carpeta_presentacion: [
          {
            nombre: 'CARÁTULA',
            hijos: []
          },
          {
            nombre: 'CARGA ACADÉMICA',
            hijos: []
          }
        ],
        cursos: [
          {
            nombre_asignatura: 'Internet de las Cosas',
            carpetas: [
              {
                nombre: 'SILABOS',
                hijos: [
                  { nombre: 'Silabo UNSAAC', hijos: [] },
                  { nombre: 'Silabo ICACIT', hijos: [] }
                ]
              },
              {
                nombre: 'AVANCE ACADÉMICO',
                hijos: []
              }
            ]
          }
        ]
      }
    ]
  }
];
