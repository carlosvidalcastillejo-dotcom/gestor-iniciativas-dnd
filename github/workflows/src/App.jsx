import React, { useState } from 'react';
import InitiativesTab from './components/InitiativesTab';
import DataTab from './components/DataTab';

const App = () => {
  const [activeTab, setActiveTab] = useState('iniciativas');

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="max-w-7xl mx-auto">
        {/* Título Global */}
        <div className="bg-gradient-to-r from-amber-800 to-orange-900 text-white p-4 sm:p-6 shadow-lg">
          <h1 className="text-3xl sm:text-4xl font-bold text-center">Gestor de Combate</h1>
        </div>

        {/* Sistema de Pestañas */}
        <div className="bg-gradient-to-r from-amber-700 to-orange-800 shadow-md">
          <div className="flex justify-center">
            <button
              onClick={() => setActiveTab('iniciativas')}
              className={'flex-1 max-w-xs px-6 py-3 font-bold text-lg transition-all ' +
                (activeTab === 'iniciativas'
                  ? 'bg-white text-amber-900 border-b-4 border-amber-900'
                  : 'text-white hover:bg-amber-600')}
            >
              Iniciativas
            </button>
            <button
              onClick={() => setActiveTab('datos')}
              className={'flex-1 max-w-xs px-6 py-3 font-bold text-lg transition-all ' +
                (activeTab === 'datos'
                  ? 'bg-white text-amber-900 border-b-4 border-amber-900'
                  : 'text-white hover:bg-amber-600')}
            >
              Datos
            </button>
          </div>
        </div>

        {/* Contenido de las Pestañas */}
        {activeTab === 'iniciativas' && <InitiativesTab />}
        {activeTab === 'datos' && <DataTab />}
      </div>
    </div>
  );
};

export default App;
