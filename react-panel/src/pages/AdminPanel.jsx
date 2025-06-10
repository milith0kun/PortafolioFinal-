// 📁 /react-panel/src/pages/AdminPanel.jsx
import React, { useEffect, useState } from 'react';
import FolderTree from '../components/FolderTree';
import FileList from '../components/FileList';
import FiltroPanel from '../components/FiltroPanel';
import ObservacionModal from '../components/ObservacionModal';
import { ejemploEstructura } from '../mock/arbolEjemplo';
import '../styles/admin.css';

const AdminPanel = () => {
  const [estructura, setEstructura] = useState([]);
  const [carpetaSeleccionada, setCarpetaSeleccionada] = useState(null);
  const [archivos, setArchivos] = useState([]);
  const [observaciones, setObservaciones] = useState(null);

  useEffect(() => {
    setEstructura(ejemploEstructura);
  }, []);

  const manejarSeleccionCarpeta = (carpeta) => {
    setCarpetaSeleccionada(carpeta);
    // Simulación de archivos por carpeta seleccionada
    const archivosSimulados = carpeta?.nombre_asignatura || carpeta?.nombre
      ? [
          {
            nombre: 'archivo1.pdf',
            estado: 'pendiente',
            fecha: '2025-05-01',
            observaciones: [
              { autor: 'Verificador', comentario: 'Falta firma.', fecha: '2025-05-03' }
            ]
          },
          {
            nombre: 'informe_final.docx',
            estado: 'validado',
            fecha: '2025-05-02',
            observaciones: []
          }
        ]
      : [];
    setArchivos(archivosSimulados);
  };

  return (
    <div className="admin-panel">
      <h2>📂 Panel de Administración de Portafolios</h2>
      <FiltroPanel />
      <div className="panel-grid">
        <FolderTree data={estructura} onSelect={manejarSeleccionCarpeta} />
        <FileList
          carpetaSeleccionada={carpetaSeleccionada}
          archivos={archivos}
          onVerObservacion={setObservaciones}
        />
      </div>
      {observaciones && (
        <ObservacionModal observaciones={observaciones} onClose={() => setObservaciones(null)} />
      )}
    </div>
  );
};

export default AdminPanel;
