// 📁 /react-panel/src/components/FileList.jsx
import React from 'react';
import '../styles/FileList.css';

const estadosColor = {
  pendiente: '🔴',
  enviado: '🟡',
  validado: '🟢',
};

const FileList = ({ archivos, onVerObservacion }) => {
  if (!archivos || archivos.length === 0) {
    return <div className="file-list"><p>No hay archivos disponibles.</p></div>;
  }

  return (
    <div className="file-list">
      <h3>📄 Archivos</h3>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Estado</th>
            <th>Fecha</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {archivos.map((archivo, i) => (
            <tr key={i}>
              <td>{archivo.nombre}</td>
              <td>{estadosColor[archivo.estado] || '⚪'} {archivo.estado}</td>
              <td>{archivo.fecha || '---'}</td>
              <td>
                <button onClick={() => onVerObservacion(archivo.observaciones || [])}>
                  Ver Observación
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FileList;
