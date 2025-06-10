// 📁 /react-panel/src/components/FiltroPanel.jsx
import React, { useState } from 'react';
import '../styles/filtropanel.css';

const FiltroPanel = ({ onFiltrar }) => {
  const [filtros, setFiltros] = useState({
    carrera: '',
    curso: '',
    estado: '',
    semestre: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFiltros({ ...filtros, [name]: value });
  };

  const aplicarFiltros = () => {
    if (onFiltrar) onFiltrar(filtros);
  };

  return (
    <div className="filtro-panel">
      <h4>🎯 Filtrar archivos</h4>
      <div className="filtros-grid">
        <input type="text" name="carrera" placeholder="Carrera" onChange={handleChange} />
        <input type="text" name="curso" placeholder="Curso" onChange={handleChange} />
        <input type="text" name="semestre" placeholder="Semestre" onChange={handleChange} />
        <select name="estado" onChange={handleChange}>
          <option value="">Todos</option>
          <option value="pendiente">Pendiente</option>
          <option value="enviado">Enviado</option>
          <option value="validado">Validado</option>
        </select>
        <button onClick={aplicarFiltros}>Aplicar</button>
      </div>
    </div>
  );
};

export default FiltroPanel;
