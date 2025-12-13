import React, { useState, useEffect } from 'react';
import { Plus, Save, Trash2, RotateCcw, AlertCircle, ChevronLeft, ChevronRight, UserPlus, Upload } from 'lucide-react';

const InitiativesTab = () => {
  const [turnos, setTurnos] = useState(1);
  const [jugadores, setJugadores] = useState([]);
  const [jugadorActivo, setJugadorActivo] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [showTieModal, setShowTieModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const [newPlayer, setNewPlayer] = useState({ nombre: '', iniciativa: '' });
  const [newCounter, setNewCounter] = useState({
    jugadorId: null,
    tipo: 'malus',
    nombre: '',
    valor: ''
  });
  const [reorderData, setReorderData] = useState(null);
  const [tieData, setTieData] = useState(null);

  useEffect(() => {
    const loadData = () => {
      try {
        const savedData = localStorage.getItem('combatData');
        if (savedData) {
          const data = JSON.parse(savedData);
          setJugadores(data.jugadores || []);
          setTurnos(data.turnos || 1);
          setJugadorActivo(data.jugadorActivo || 0);
        }
      } catch (error) {
        console.log('No hay datos guardados');
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (jugadores.length > 0) {
      const timer = setTimeout(() => {
        guardarAutomatico();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [jugadores, turnos, jugadorActivo]);

  const guardarAutomatico = () => {
    try {
      localStorage.setItem('combatData', JSON.stringify({
        jugadores,
        turnos,
        jugadorActivo
      }));
    } catch (error) {
      console.error('Error al guardar:', error);
    }
  };

  const exportarExcel = async () => {
    if (jugadores.length === 0) return;

    try {
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs');

      const data = jugadores.map((j, idx) => {
        const row = {
          'Posicion': idx + 1,
          'Nombre': j.nombre,
          'Iniciativa': j.iniciativa
        };

        j.malus.forEach((m, i) => {
          row['Malus_' + (i + 1) + '_Nombre'] = m.nombre;
          row['Malus_' + (i + 1) + '_Valor'] = m.valor;
        });

        j.bonus.forEach((b, i) => {
          row['Bonus_' + (i + 1) + '_Nombre'] = b.nombre;
          row['Bonus_' + (i + 1) + '_Valor'] = b.valor;
        });

        row['Turno_Activo'] = idx === jugadorActivo ? 'SI' : 'NO';
        return row;
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Iniciativas');

      const now = new Date();
      const dia = String(now.getDate()).padStart(2, '0');
      const mes = String(now.getMonth() + 1).padStart(2, '0');
      const año = now.getFullYear();
      const hora = String(now.getHours()).padStart(2, '0');
      const minuto = String(now.getMinutes()).padStart(2, '0');
      const segundo = String(now.getSeconds()).padStart(2, '0');

      const fileName = 'Iniciativa_' + dia + mes + año + '_' + hora + minuto + segundo + '.xlsx';
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      alert('Error al exportar Excel: ' + error.message);
    }
  };

  const cargarExcel = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs');

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);

          if (jsonData.length === 0) {
            alert('El archivo Excel está vacío');
            return;
          }

          const nuevosJugadores = [];

          jsonData.forEach(row => {
            if (!row.Nombre || row.Iniciativa === undefined) return;

            const jugador = {
              id: Date.now().toString() + Math.random(),
              nombre: row.Nombre,
              iniciativa: parseInt(row.Iniciativa),
              malus: [],
              bonus: []
            };

            for (let key in row) {
              if (key.indexOf('Malus_') === 0 && key.indexOf('_Nombre') > 0 && row[key]) {
                const matches = key.match(/\d+/);
                if (matches) {
                  const index = matches[0];
                  const valorKey = 'Malus_' + index + '_Valor';
                  if (row[valorKey] && parseInt(row[valorKey]) > 0) {
                    jugador.malus.push({
                      id: Date.now().toString() + Math.random(),
                      nombre: row[key],
                      valor: parseInt(row[valorKey])
                    });
                  }
                }
              }

              if (key.indexOf('Bonus_') === 0 && key.indexOf('_Nombre') > 0 && row[key]) {
                const matches = key.match(/\d+/);
                if (matches) {
                  const index = matches[0];
                  const valorKey = 'Bonus_' + index + '_Valor';
                  if (row[valorKey] && parseInt(row[valorKey]) > 0) {
                    jugador.bonus.push({
                      id: Date.now().toString() + Math.random(),
                      nombre: row[key],
                      valor: parseInt(row[valorKey])
                    });
                  }
                }
              }
            }

            nuevosJugadores.push(jugador);
          });

          if (nuevosJugadores.length > 0) {
            setJugadores(ordenarJugadores(nuevosJugadores));
            setJugadorActivo(0);
            setTurnos(1);
            alert('Se cargaron ' + nuevosJugadores.length + ' jugadores correctamente');
          } else {
            alert('No se encontraron jugadores válidos en el archivo');
          }

        } catch (error) {
          alert('Error al procesar el archivo: ' + error.message);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      alert('Error al cargar Excel: ' + error.message);
    }

    event.target.value = '';
  };

  const ordenarJugadores = (lista) => {
    return [...lista].sort((a, b) => b.iniciativa - a.iniciativa);
  };

  const checkTie = (nuevaIniciativa, nombreNuevo) => {
    const jugadoresConMismaIniciativa = jugadores.filter(j => j.iniciativa === nuevaIniciativa);
    if (jugadoresConMismaIniciativa.length > 0) {
      setTieData({
        jugadores: [...jugadoresConMismaIniciativa.map(j => j.nombre), nombreNuevo],
        iniciativa: nuevaIniciativa,
        nuevoJugador: nombreNuevo
      });
      setShowTieModal(true);
      return true;
    }
    return false;
  };

  const handleAddPlayer = () => {
    if (!newPlayer.nombre || !newPlayer.iniciativa) {
      alert('Por favor completa nombre e iniciativa');
      return;
    }

    const iniciativaNum = parseInt(newPlayer.iniciativa);
    const nuevoJugador = {
      id: Date.now().toString(),
      nombre: newPlayer.nombre,
      iniciativa: iniciativaNum,
      malus: [],
      bonus: []
    };

    if (checkTie(iniciativaNum, newPlayer.nombre)) {
      window.tempPlayer = nuevoJugador;
    } else {
      const nuevaLista = ordenarJugadores([...jugadores, nuevoJugador]);
      setJugadores(nuevaLista);
      setShowAddModal(false);
      setNewPlayer({ nombre: '', iniciativa: '' });
    }
  };

  const handleTieResolution = (selectedName) => {
    const nuevoJugador = window.tempPlayer;
    let nuevaLista = [...jugadores, nuevoJugador];

    nuevaLista = nuevaLista.sort((a, b) => b.iniciativa - a.iniciativa);

    const iniciativa = nuevoJugador.iniciativa;
    const startIdx = nuevaLista.findIndex(j => j.iniciativa === iniciativa);
    const endIdx = nuevaLista.findLastIndex(j => j.iniciativa === iniciativa);

    const grupo = nuevaLista.slice(startIdx, endIdx + 1);
    const selectedIdx = grupo.findIndex(j => j.nombre === selectedName);

    if (selectedIdx > 0) {
      const selected = grupo.splice(selectedIdx, 1)[0];
      grupo.unshift(selected);
      nuevaLista.splice(startIdx, grupo.length, ...grupo);
    }

    setJugadores(nuevaLista);
    setShowTieModal(false);
    setShowAddModal(false);
    setNewPlayer({ nombre: '', iniciativa: '' });
    setTieData(null);
    delete window.tempPlayer;
  };

  const handleDeletePlayer = (id) => {
    setDeleteTargetId(id);
    setShowDeleteModal(true);
  };

  const confirmarEliminacion = () => {
    setJugadores(jugadores.filter(j => j.id !== deleteTargetId));
    if (jugadorActivo >= jugadores.length - 1) {
      setJugadorActivo(Math.max(0, jugadores.length - 2));
    }
    setShowDeleteModal(false);
    setDeleteTargetId(null);
  };

  const handleAddCounter = (jugadorId, tipo) => {
    setNewCounter({ jugadorId, tipo, nombre: '', valor: '' });
    setShowCounterModal(true);
  };

  const handleSaveCounter = () => {
    if (!newCounter.nombre || !newCounter.valor) {
      alert('Por favor completa nombre y valor');
      return;
    }

    const valor = parseInt(newCounter.valor);
    if (valor <= 0) {
      alert('El valor debe ser mayor a 0');
      return;
    }

    setJugadores(jugadores.map(j => {
      if (j.id === newCounter.jugadorId) {
        const counters = [...j[newCounter.tipo], {
          id: Date.now().toString(),
          nombre: newCounter.nombre,
          valor
        }];
        return { ...j, [newCounter.tipo]: counters };
      }
      return j;
    }));

    setShowCounterModal(false);
    setNewCounter({ jugadorId: null, tipo: 'malus', nombre: '', valor: '' });
  };

  const handleEditCounter = (jugadorId, tipo, counterId, nuevoValor) => {
    const valor = parseInt(nuevoValor);
    if (isNaN(valor) || valor < 0) return;

    setJugadores(jugadores.map(j => {
      if (j.id === jugadorId) {
        const counters = j[tipo].map(c =>
          c.id === counterId ? { ...c, valor } : c
        ).filter(c => c.valor > 0);
        return { ...j, [tipo]: counters };
      }
      return j;
    }));
  };

  const handleEditInitiative = (id, nuevaIniciativa) => {
    const valor = parseInt(nuevaIniciativa);
    if (isNaN(valor)) return;

    const jugadorModificado = jugadores.find(j => j.id === id);
    const jugadoresOrdenados = ordenarJugadores(
      jugadores.map(j => j.id === id ? { ...j, iniciativa: valor } : j)
    );

    const posicionActual = jugadores.findIndex(j => j.id === id);
    const nuevaPosicion = jugadoresOrdenados.findIndex(j => j.id === id);

    if (posicionActual !== nuevaPosicion) {
      setReorderData({
        jugador: jugadorModificado.nombre,
        posicionActual: posicionActual + 1,
        nuevaPosicion: nuevaPosicion + 1,
        jugadoresOrdenados
      });
      setShowReorderModal(true);
    } else {
      setJugadores(jugadoresOrdenados);
    }
  };

  const confirmarReorden = (confirmar) => {
    if (confirmar) {
      setJugadores(reorderData.jugadoresOrdenados);
    }
    setShowReorderModal(false);
    setReorderData(null);
  };

  const decrementarContadores = () => {
    setJugadores(jugadores.map(j => ({
      ...j,
      malus: j.malus.map(c => ({ ...c, valor: Math.max(0, c.valor - 1) })).filter(c => c.valor > 0),
      bonus: j.bonus.map(c => ({ ...c, valor: Math.max(0, c.valor - 1) })).filter(c => c.valor > 0)
    })));
  };

  const siguienteTurno = () => {
    if (jugadorActivo === jugadores.length - 1) {
      setTurnos(turnos + 1);
      setJugadorActivo(0);
      decrementarContadores();
    } else {
      setJugadorActivo(jugadorActivo + 1);
    }
  };

  const anteriorTurno = () => {
    if (jugadorActivo === 0) {
      setTurnos(Math.max(1, turnos - 1));
      setJugadorActivo(jugadores.length - 1);
    } else {
      setJugadorActivo(jugadorActivo - 1);
    }
  };

  const reiniciarCombate = () => {
    setJugadores([]);
    setTurnos(1);
    setJugadorActivo(0);
    try {
      localStorage.removeItem('combatData');
    } catch (error) {
      console.log('Error al limpiar datos');
    }
    setShowResetModal(false);
  };

  return (
    <div className="p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-amber-800 to-orange-900 text-white rounded-t-lg p-4 sm:p-6 shadow-lg">
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-4">Iniciativas</h1>

          <div className="flex items-center justify-center gap-8 mb-4">
            <div className="text-center">
              <div className="text-sm opacity-80">Turno de Combate</div>
              <div className="text-4xl sm:text-5xl font-bold">{turnos}</div>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={anteriorTurno}
              disabled={jugadores.length === 0}
              className="px-4 sm:px-6 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 disabled:opacity-50 rounded-lg font-semibold transition flex items-center gap-2"
            >
              <ChevronLeft size={20} />
              <span className="hidden sm:inline">Anterior</span>
            </button>
            <button
              onClick={siguienteTurno}
              disabled={jugadores.length === 0}
              className="px-4 sm:px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:opacity-50 rounded-lg font-semibold transition flex items-center gap-2"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="bg-white border-x border-orange-200 p-3 sm:p-4 flex justify-between items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 font-semibold text-sm sm:text-base"
          >
            <UserPlus size={18} className="sm:hidden" />
            <Plus size={18} className="hidden sm:block" />
            <span className="hidden sm:inline">Añadir Jugador</span>
            <span className="sm:hidden">PJ</span>
          </button>

          <div className="flex gap-2">
            <label className="px-3 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 cursor-pointer">
              <Upload size={18} />
              <span className="hidden md:inline">Cargar</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={cargarExcel}
                className="hidden"
              />
            </label>
            <button
              onClick={exportarExcel}
              disabled={jugadores.length === 0}
              className="px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2"
              title="Exportar a Excel"
            >
              <Save size={18} />
              <span className="hidden md:inline">Guardar</span>
            </button>
            <button
              onClick={() => setShowResetModal(true)}
              className="px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2"
              title="Reiniciar combate"
            >
              <RotateCcw size={18} />
              <span className="hidden md:inline">Reiniciar</span>
            </button>
          </div>
        </div>

        <div className="bg-white border border-orange-200 rounded-b-lg shadow-lg overflow-hidden">
          {jugadores.length === 0 ? (
            <div className="p-8 sm:p-12 text-center text-gray-500">
              <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-base sm:text-lg">No hay jugadores. Añade algunos para comenzar el combate.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm sm:text-base">
                <thead className="bg-gradient-to-r from-orange-100 to-amber-100 border-b-2 border-orange-300">
                  <tr>
                    <th className="p-2 sm:p-4 text-left font-bold text-gray-700">Nombre</th>
                    <th className="p-2 sm:p-4 text-center font-bold text-gray-700">Inic.</th>
                    <th className="p-2 sm:p-4 text-center font-bold text-gray-700 hidden lg:table-cell">Malus</th>
                    <th className="p-2 sm:p-4 text-center font-bold text-gray-700 hidden lg:table-cell">Bonus</th>
                    <th className="p-2 sm:p-4 text-center font-bold text-gray-700">Acc.</th>
                  </tr>
                </thead>
                <tbody>
                  {jugadores.map((jugador, idx) => (
                    <tr
                      key={jugador.id}
                      className={'border-b border-orange-100 transition ' + (idx === jugadorActivo ? 'bg-yellow-100 border-l-4 border-l-yellow-500 shadow-md' : 'hover:bg-orange-50')}
                    >
                      <td className="p-2 sm:p-4">
                        <div className="font-semibold text-base sm:text-lg text-gray-800">
                          {idx === jugadorActivo && <span className="mr-2">⭐</span>}
                          {jugador.nombre}
                        </div>
                        <div className="flex flex-wrap gap-1 sm:gap-2 mt-2 lg:hidden">
                          {jugador.malus.map(c => (
                            <span key={c.id} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded flex items-center gap-1">
                              {c.nombre}:
                              <input
                                type="number"
                                value={c.valor}
                                onChange={(e) => handleEditCounter(jugador.id, 'malus', c.id, e.target.value)}
                                className="w-8 text-center bg-red-50 border border-red-300 rounded px-1"
                                min="0"
                              />
                            </span>
                          ))}
                          {jugador.bonus.map(c => (
                            <span key={c.id} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                              {c.nombre}:
                              <input
                                type="number"
                                value={c.valor}
                                onChange={(e) => handleEditCounter(jugador.id, 'bonus', c.id, e.target.value)}
                                className="w-8 text-center bg-green-50 border border-green-300 rounded px-1"
                                min="0"
                              />
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2 mt-2 lg:hidden">
                          <button
                            onClick={() => handleAddCounter(jugador.id, 'malus')}
                            className="text-xs bg-red-500 text-white px-3 py-1 rounded font-bold hover:bg-red-600"
                          >
                            + Malus
                          </button>
                          <button
                            onClick={() => handleAddCounter(jugador.id, 'bonus')}
                            className="text-xs bg-green-500 text-white px-3 py-1 rounded font-bold hover:bg-green-600"
                          >
                            + Bonus
                          </button>
                        </div>
                      </td>
                      <td className="p-2 sm:p-4 text-center">
                        <input
                          type="number"
                          value={jugador.iniciativa}
                          onChange={(e) => handleEditInitiative(jugador.id, e.target.value)}
                          className="w-14 sm:w-20 text-center text-lg sm:text-2xl font-bold border-2 border-orange-300 rounded-lg p-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </td>
                      <td className="p-2 sm:p-4 text-center hidden lg:table-cell">
                        <div className="flex flex-col gap-2 items-center">
                          {jugador.malus.map(c => (
                            <input
                              key={c.id}
                              type="number"
                              value={c.valor}
                              onChange={(e) => handleEditCounter(jugador.id, 'malus', c.id, e.target.value)}
                              className="w-16 text-center text-lg font-semibold border-2 border-red-300 bg-red-50 rounded p-1"
                              min="0"
                            />
                          ))}
                          <button
                            onClick={() => handleAddCounter(jugador.id, 'malus')}
                            className="text-red-600 hover:text-red-800 font-bold text-xl"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="p-2 sm:p-4 text-center hidden lg:table-cell">
                        <div className="flex flex-col gap-2 items-center">
                          {jugador.bonus.map(c => (
                            <input
                              key={c.id}
                              type="number"
                              value={c.valor}
                              onChange={(e) => handleEditCounter(jugador.id, 'bonus', c.id, e.target.value)}
                              className="w-16 text-center text-lg font-semibold border-2 border-green-300 bg-green-50 rounded p-1"
                              min="0"
                            />
                          ))}
                          <button
                            onClick={() => handleAddCounter(jugador.id, 'bonus')}
                            className="text-green-600 hover:text-green-800 font-bold text-xl"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="p-2 sm:p-4 text-center">
                        <button
                          onClick={() => handleDeletePlayer(jugador.id)}
                          className="text-red-600 hover:text-red-800 p-2"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full">
            <h2 className="text-xl sm:text-2xl font-bold mb-4">Añadir Jugador</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Nombre</label>
                <input
                  type="text"
                  value={newPlayer.nombre}
                  onChange={(e) => setNewPlayer({...newPlayer, nombre: e.target.value})}
                  className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nombre del jugador"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Iniciativa</label>
                <input
                  type="number"
                  value={newPlayer.iniciativa}
                  onChange={(e) => setNewPlayer({...newPlayer, iniciativa: e.target.value})}
                  className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Valor de iniciativa"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddPlayer}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
              >
                Añadir
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewPlayer({ nombre: '', iniciativa: '' });
                }}
                className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showCounterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full">
            <h2 className="text-xl sm:text-2xl font-bold mb-4">
              Añadir {newCounter.tipo === 'malus' ? 'Malus' : 'Bonus'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Nombre del efecto</label>
                <input
                  type="text"
                  value={newCounter.nombre}
                  onChange={(e) => setNewCounter({...newCounter, nombre: e.target.value})}
                  className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ej: Paralizado"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Duración (turnos)</label>
                <input
                  type="number"
                  value={newCounter.valor}
                  onChange={(e) => setNewCounter({...newCounter, valor: e.target.value})}
                  className="w-full border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Número de turnos"
                  min="1"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveCounter}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
              >
                Añadir
              </button>
              <button
                onClick={() => {
                  setShowCounterModal(false);
                  setNewCounter({ jugadorId: null, tipo: 'malus', nombre: '', valor: '' });
                }}
                className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showTieModal && tieData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-orange-600">Empate</h2>
            <p className="mb-4">
              Varios jugadores tienen iniciativa {tieData.iniciativa}. ¿Quién debe ir primero?
            </p>
            <div className="space-y-2">
              {tieData.jugadores.map((nombre) => (
                <button
                  key={nombre}
                  onClick={() => handleTieResolution(nombre)}
                  className="w-full px-4 py-3 bg-blue-100 hover:bg-blue-200 border-2 border-blue-300 rounded-lg font-semibold text-left"
                >
                  {nombre}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showReorderModal && reorderData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-orange-600">Reordenar</h2>
            <p className="mb-4">
              {reorderData.jugador} cambió de iniciativa. ¿Reordenar lista?
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Posición actual: #{reorderData.posicionActual} - Nueva: #{reorderData.nuevaPosicion}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => confirmarReorden(true)}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
              >
                Sí
              </button>
              <button
                onClick={() => confirmarReorden(false)}
                className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-red-600">Eliminar</h2>
            <p className="mb-6">¿Seguro que quieres eliminar este jugador?</p>
            <div className="flex gap-3">
              <button
                onClick={confirmarEliminacion}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
              >
                Sí
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteTargetId(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-red-600">Reiniciar Combate</h2>
            <p className="mb-6">¿Seguro que quieres reiniciar el combate? Se perderán todos los datos.</p>
            <div className="flex gap-3">
              <button
                onClick={reiniciarCombate}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
              >
                Sí, reiniciar
              </button>
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InitiativesTab;
