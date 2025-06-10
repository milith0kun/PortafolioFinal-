// 📁 /react-panel/src/components/ObservacionModal.jsx
import React from 'react';
import '../styles/observacionmodal.css';

const ObservacionModal = ({ observaciones, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>📝 Observaciones del archivo</h3>
        {observaciones.length === 0 ? (
          <p>No hay observaciones registradas.</p>
        ) : (
          <ul>
            {observaciones.map((obs, idx) => (
              <li key={idx}>
                <strong>{obs.autor || 'Verificador'}:</strong> {obs.comentario} <br />
                <em>{obs.fecha || '---'}</em>
              </li>
            ))}
          </ul>
        )}
        <button onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
};

export default ObservacionModal;
