// 📁 /react-panel/src/components/FolderTree.jsx


import React from 'react';
import '../styles/FolderTree.css';
const FolderTree = ({ data, onSelect }) => {
  const renderCarpetas = (carpetas, nivel = 0) => {
    return (
      <ul>
        {carpetas.map((item, idx) => (
          <li key={idx} style={{ marginLeft: nivel * 16 }}>
            <button onClick={() => onSelect(item)}>
              {item.nombre_asignatura
                ? `📘 ${item.nombre_asignatura}`
                : item.nombre_docente
                  ? `👨‍🏫 ${item.nombre_docente}`
                  : item.nombre_semestre
                    ? `📅 ${item.nombre_semestre}`
                    : `📁 ${item.nombre_carpeta || item.nombre}`}
            </button>
            {/* Recursividad en árbol */}
            {item.docentes && renderCarpetas(item.docentes, nivel + 1)}
            {item.cursos && renderCarpetas(item.cursos, nivel + 1)}
            {item.carpeta_presentacion && renderCarpetas(item.carpeta_presentacion, nivel + 1)}
            {item.carpetas && renderCarpetas(item.carpetas, nivel + 1)}
            {item.hijos && renderCarpetas(item.hijos, nivel + 1)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="folder-tree">
      <h3>🗂 Estructura</h3>
      {data.length > 0 ? renderCarpetas(data) : <p>No hay estructura disponible.</p>}
    </div>
  );
};

export default FolderTree;
