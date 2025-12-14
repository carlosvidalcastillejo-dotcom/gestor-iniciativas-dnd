import React, { useState, useEffect } from 'react';
import { Plus, ChevronDown, ChevronRight, Trash2, Save, X } from 'lucide-react';

const DataTab = () => {
  const [personajes, setPersonajes] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBonusMalusModal, setShowBonusMalusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [showClearDataModal, setShowClearDataModal] = useState(false);

  const [formData, setFormData] = useState({
    id: null,
    nombre: '',
    pg: { actuales: '', totales: '' },
    ca: { normal: '', toque: '', desprevenido: '' },
    iniciativa: '',
    ataques: [],
    salvaciones: { fortaleza: '', reflejos: '', voluntad: '' },
    bonusMalus: []
  });

  const [bonusMalusForm, setBonusMalusForm] = useState({
    personajeId: null,
    tipo: 'bonus',
    campos: [],
    nombre: '',
    valor: ''
  });

  const [currentAtaque, setCurrentAtaque] = useState({
    nombre: '',
    bonusAtaque: '',
    dado: '',
    constante: ''
  });

  // Función para migrar datos antiguos al nuevo formato
  const migrarDatosAntiguos = (personajes) => {
    return personajes.map(personaje => {
      // Migrar ataques del formato antiguo al nuevo
      const ataquesMigrados = personaje.ataques.map(ataque => {
        // Si ya tiene el formato nuevo, devolverlo tal cual
        if (ataque.dado !== undefined && ataque.constante !== undefined) {
          return ataque;
        }

        // Si tiene el formato antiguo con 'danio', convertirlo
        if (ataque.danio !== undefined) {
          return {
            ...ataque,
            dado: '',
            constante: ataque.danio || '',
            danio: undefined // Eliminar el campo antiguo
          };
        }

        // Si tiene el formato muy antiguo con numDados, carasDado, constante
        if (ataque.numDados !== undefined || ataque.carasDado !== undefined) {
          const dado = (ataque.numDados && ataque.carasDado)
            ? `${ataque.numDados}d${ataque.carasDado}`
            : '';
          return {
            id: ataque.id,
            nombre: ataque.nombre || '',
            bonusAtaque: ataque.bonusAtaque || '',
            dado: dado,
            constante: ataque.constante || ''
          };
        }

        // Si no tiene ninguno de estos campos, usar el formato nuevo vacío
        return {
          ...ataque,
          dado: ataque.dado || '',
          constante: ataque.constante || ''
        };
      });

      return {
        ...personaje,
        ataques: ataquesMigrados
      };
    });
  };

  // Cargar datos desde localStorage
  useEffect(() => {
    const loadData = () => {
      try {
        const savedData = localStorage.getItem('characterData');
        if (savedData) {
          const personajesCargados = JSON.parse(savedData);
          const personajesMigrados = migrarDatosAntiguos(personajesCargados);
          setPersonajes(personajesMigrados);

          // Guardar los datos migrados inmediatamente
          localStorage.setItem('characterData', JSON.stringify(personajesMigrados));
        }
      } catch (error) {
        console.log('No hay datos de personajes guardados');
      }
    };
    loadData();
  }, []);

  // Guardar automáticamente
  useEffect(() => {
    if (personajes.length > 0) {
      const timer = setTimeout(() => {
        localStorage.setItem('characterData', JSON.stringify(personajes));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [personajes]);

  const resetForm = () => {
    setFormData({
      id: null,
      nombre: '',
      pg: { actuales: '', totales: '' },
      ca: { normal: '', toque: '', desprevenido: '' },
      iniciativa: '',
      ataques: [],
      salvaciones: { fortaleza: '', reflejos: '', voluntad: '' },
      bonusMalus: []
    });
  };

  const handleAddPersonaje = () => {
    if (!formData.nombre) {
      alert('El nombre es obligatorio');
      return;
    }

    const nuevoPersonaje = {
      id: Date.now().toString(),
      ...formData,
      pg: {
        actuales: formData.pg.totales || formData.pg.actuales,
        totales: formData.pg.totales
      }
    };

    setPersonajes([...personajes, nuevoPersonaje]);
    resetForm();
    setShowAddModal(false);
  };

  const handleDeletePersonaje = (id) => {
    setDeleteTargetId(id);
    setShowDeleteModal(true);
  };

  const confirmarEliminacion = () => {
    setPersonajes(personajes.filter(p => p.id !== deleteTargetId));
    setShowDeleteModal(false);
    setDeleteTargetId(null);
  };

  const updatePersonajeField = (id, path, value) => {
    setPersonajes(personajes.map(p => {
      if (p.id !== id) return p;

      const pathParts = path.split('.');
      const newPersonaje = { ...p };
      let current = newPersonaje;

      for (let i = 0; i < pathParts.length - 1; i++) {
        current[pathParts[i]] = { ...current[pathParts[i]] };
        current = current[pathParts[i]];
      }

      current[pathParts[pathParts.length - 1]] = value;
      return newPersonaje;
    }));
  };

  const addAtaqueToForm = () => {
    if (!currentAtaque.nombre || !currentAtaque.bonusAtaque) {
      alert('Nombre y bonus de ataque son obligatorios');
      return;
    }

    const nuevoAtaque = {
      id: Date.now().toString(),
      nombre: currentAtaque.nombre,
      bonusAtaque: currentAtaque.bonusAtaque,
      dado: currentAtaque.dado || '',
      constante: currentAtaque.constante || ''
    };

    setFormData({
      ...formData,
      ataques: [...formData.ataques, nuevoAtaque]
    });

    setCurrentAtaque({
      nombre: '',
      bonusAtaque: '',
      dado: '',
      constante: ''
    });
  };

  const removeAtaqueFromForm = (ataqueId) => {
    setFormData({
      ...formData,
      ataques: formData.ataques.filter(a => a.id !== ataqueId)
    });
  };

  const addAtaqueToPersonaje = (personajeId) => {
    const personaje = personajes.find(p => p.id === personajeId);
    if (!personaje) return;

    const nuevoAtaque = {
      id: Date.now().toString(),
      nombre: '',
      bonusAtaque: '',
      dado: '',
      constante: ''
    };

    setPersonajes(personajes.map(p => {
      if (p.id === personajeId) {
        return {
          ...p,
          ataques: [...p.ataques, nuevoAtaque]
        };
      }
      return p;
    }));
  };

  const removeAtaqueFromPersonaje = (personajeId, ataqueId) => {
    setPersonajes(personajes.map(p => {
      if (p.id === personajeId) {
        return {
          ...p,
          ataques: p.ataques.filter(a => a.id !== ataqueId)
        };
      }
      return p;
    }));
  };

  const updateAtaque = (personajeId, ataqueId, field, value) => {
    setPersonajes(personajes.map(p => {
      if (p.id === personajeId) {
        return {
          ...p,
          ataques: p.ataques.map(a => {
            if (a.id === ataqueId) {
              return { ...a, [field]: value };
            }
            return a;
          })
        };
      }
      return p;
    }));
  };

  const openBonusMalusModal = (personajeId) => {
    const personaje = personajes.find(p => p.id === personajeId);
    console.log('Abriendo modal para personaje:', personaje?.nombre, 'Ataques:', personaje?.ataques.length);
    setBonusMalusForm({
      personajeId,
      tipo: 'bonus',
      campos: [],
      nombre: '',
      valor: ''
    });
    setShowBonusMalusModal(true);
  };

  const toggleCampo = (campo) => {
    const campos = bonusMalusForm.campos.includes(campo)
      ? bonusMalusForm.campos.filter(c => c !== campo)
      : [...bonusMalusForm.campos, campo];

    setBonusMalusForm({ ...bonusMalusForm, campos });
  };

  const aplicarBonusMalus = () => {
    if (!bonusMalusForm.nombre || !bonusMalusForm.valor || bonusMalusForm.campos.length === 0) {
      alert('Completa nombre, valor y selecciona al menos un campo');
      return;
    }

    const valor = parseInt(bonusMalusForm.valor);
    const modificador = bonusMalusForm.tipo === 'bonus' ? valor : -valor;

    setPersonajes(personajes.map(p => {
      if (p.id !== bonusMalusForm.personajeId) return p;

      const nuevoBonusMalus = {
        id: Date.now().toString(),
        tipo: bonusMalusForm.tipo,
        nombre: bonusMalusForm.nombre,
        valor: modificador,
        campos: bonusMalusForm.campos
      };

      return {
        ...p,
        bonusMalus: [...p.bonusMalus, nuevoBonusMalus]
      };
    }));

    setShowBonusMalusModal(false);
  };

  const removeBonusMalus = (personajeId, bonusMalusId) => {
    setPersonajes(personajes.map(p => {
      if (p.id === personajeId) {
        return {
          ...p,
          bonusMalus: p.bonusMalus.filter(bm => bm.id !== bonusMalusId)
        };
      }
      return p;
    }));
  };

  const limpiarTodosDatos = () => {
    localStorage.removeItem('characterData');
    setPersonajes([]);
    setShowClearDataModal(false);
    alert('Todos los datos han sido eliminados. La página se recargará.');
    window.location.reload();
  };

  const getFieldLabel = (campo, personaje) => {
    const labels = {
      'iniciativa': 'Iniciativa',
      'ca.normal': 'CA → Normal',
      'ca.toque': 'CA → Toque',
      'ca.desprevenido': 'CA → Desprevenido',
      'salvaciones.fortaleza': 'Salvaciones → Fortaleza',
      'salvaciones.reflejos': 'Salvaciones → Reflejos',
      'salvaciones.voluntad': 'Salvaciones → Voluntad'
    };

    // Check if it's an attack field
    if (campo.startsWith('ataques.')) {
      const parts = campo.split('.');
      const ataqueId = parts[1];
      const fieldType = parts[2];

      if (personaje) {
        const ataque = personaje.ataques.find(a => a.id === ataqueId);
        const nombreAtaque = ataque?.nombre || 'Ataque';
        const tipoField = fieldType === 'bonusAtaque' ? 'Bonus Ataque' : 'Daño';
        return `${nombreAtaque} → ${tipoField}`;
      }
    }

    return labels[campo] || campo;
  };

  const calcularValorConModificadores = (personaje, campo) => {
    let valorBase = 0;

    // Obtener valor base según el campo
    if (campo === 'iniciativa') {
      valorBase = parseInt(personaje.iniciativa) || 0;
    } else if (campo.startsWith('ca.')) {
      const tipoCa = campo.split('.')[1];
      valorBase = parseInt(personaje.ca[tipoCa]) || 0;
    } else if (campo.startsWith('salvaciones.')) {
      const tipoSalvacion = campo.split('.')[1];
      valorBase = parseInt(personaje.salvaciones[tipoSalvacion]) || 0;
    } else if (campo.startsWith('ataques.')) {
      const parts = campo.split('.');
      const ataqueId = parts[1];
      const fieldType = parts[2];
      const ataque = personaje.ataques.find(a => a.id === ataqueId);

      if (ataque) {
        if (fieldType === 'bonusAtaque') {
          valorBase = parseInt(ataque.bonusAtaque) || 0;
        } else if (fieldType === 'constante') {
          valorBase = parseInt(ataque.constante) || 0;
        }
      }
    }

    // Sumar modificadores
    const modificador = personaje.bonusMalus
      .filter(bm => bm.campos.includes(campo))
      .reduce((sum, bm) => sum + bm.valor, 0);

    return valorBase + modificador;
  };

  return (
    <div className="p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-800 to-orange-900 text-white rounded-t-lg p-4 sm:p-6 shadow-lg mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-4">Datos de Personajes</h1>
          <div className="flex justify-center gap-3 flex-wrap">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 font-semibold"
            >
              <Plus size={20} />
              Añadir Personaje/Monstruo
            </button>
            {personajes.length > 0 && (
              <button
                onClick={() => setShowClearDataModal(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 font-semibold text-sm"
              >
                <Trash2 size={18} />
                Limpiar Datos
              </button>
            )}
          </div>
        </div>

        {/* Lista de Personajes */}
        {personajes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center text-gray-500">
            <p>No hay personajes. Añade algunos para gestionar el combate.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {personajes.map(personaje => (
              <div key={personaje.id} className="bg-white rounded-lg shadow-md border border-orange-200 overflow-hidden">
                {/* Header Colapsable */}
                <div
                  onClick={() => setExpandedId(expandedId === personaje.id ? null : personaje.id)}
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-orange-50 transition"
                >
                  <div className="flex items-center gap-3">
                    {expandedId === personaje.id ? (
                      <ChevronDown size={24} className="text-amber-800" />
                    ) : (
                      <ChevronRight size={24} className="text-amber-800" />
                    )}
                    <span className="text-xl font-bold text-gray-800">{personaje.nombre}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePersonaje(personaje.id);
                    }}
                    className="text-red-600 hover:text-red-800 p-2"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                {/* Contenido Expandido */}
                {expandedId === personaje.id && (
                  <div className="p-4 border-t border-orange-200 bg-gradient-to-br from-amber-50 to-orange-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* PG */}
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Puntos de Vida</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={personaje.pg.actuales}
                            onChange={(e) => updatePersonajeField(personaje.id, 'pg.actuales', e.target.value)}
                            className="w-16 border-2 border-red-300 rounded p-1 text-center font-bold text-base"
                            placeholder="Act"
                          />
                          <span className="text-lg font-bold text-gray-600">/</span>
                          <input
                            type="number"
                            value={personaje.pg.totales}
                            onChange={(e) => updatePersonajeField(personaje.id, 'pg.totales', e.target.value)}
                            className="w-16 border-2 border-green-300 rounded p-1 text-center font-bold text-base"
                            placeholder="Tot"
                          />
                        </div>
                      </div>

                      {/* Iniciativa */}
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Iniciativa</label>
                        <input
                          type="number"
                          value={personaje.iniciativa}
                          onChange={(e) => updatePersonajeField(personaje.id, 'iniciativa', e.target.value)}
                          className="w-full border-2 border-blue-300 rounded-lg p-2 text-center font-bold text-lg"
                        />
                        {personaje.bonusMalus.some(bm => bm.campos.includes('iniciativa')) && (
                          <div className="mt-2 text-center text-sm font-semibold text-blue-600">
                            Total con modificadores: {calcularValorConModificadores(personaje, 'iniciativa')}
                          </div>
                        )}
                      </div>

                      {/* CA */}
                      <div className="bg-white p-3 rounded-lg shadow-sm md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Clase de Armadura</label>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <div className="text-xs text-gray-600 mb-1">Normal</div>
                            <input
                              type="number"
                              value={personaje.ca.normal}
                              onChange={(e) => updatePersonajeField(personaje.id, 'ca.normal', e.target.value)}
                              className="w-full border-2 border-purple-300 rounded-lg p-2 text-center font-bold"
                            />
                            {personaje.bonusMalus.some(bm => bm.campos.includes('ca.normal')) && (
                              <div className="text-xs text-center text-purple-600 mt-1">
                                +Mod: {calcularValorConModificadores(personaje, 'ca.normal')}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-xs text-gray-600 mb-1">Toque</div>
                            <input
                              type="number"
                              value={personaje.ca.toque}
                              onChange={(e) => updatePersonajeField(personaje.id, 'ca.toque', e.target.value)}
                              className="w-full border-2 border-purple-300 rounded-lg p-2 text-center font-bold"
                            />
                            {personaje.bonusMalus.some(bm => bm.campos.includes('ca.toque')) && (
                              <div className="text-xs text-center text-purple-600 mt-1">
                                +Mod: {calcularValorConModificadores(personaje, 'ca.toque')}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-xs text-gray-600 mb-1">Despreven.</div>
                            <input
                              type="number"
                              value={personaje.ca.desprevenido}
                              onChange={(e) => updatePersonajeField(personaje.id, 'ca.desprevenido', e.target.value)}
                              className="w-full border-2 border-purple-300 rounded-lg p-2 text-center font-bold"
                            />
                            {personaje.bonusMalus.some(bm => bm.campos.includes('ca.desprevenido')) && (
                              <div className="text-xs text-center text-purple-600 mt-1">
                                +Mod: {calcularValorConModificadores(personaje, 'ca.desprevenido')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Salvaciones */}
                      <div className="bg-white p-3 rounded-lg shadow-sm md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Salvaciones</label>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <div className="text-xs text-gray-600 mb-1">Fortaleza</div>
                            <input
                              type="number"
                              value={personaje.salvaciones.fortaleza}
                              onChange={(e) => updatePersonajeField(personaje.id, 'salvaciones.fortaleza', e.target.value)}
                              className="w-full border-2 border-orange-300 rounded-lg p-2 text-center font-bold"
                            />
                            {personaje.bonusMalus.some(bm => bm.campos.includes('salvaciones.fortaleza')) && (
                              <div className="text-xs text-center text-orange-600 mt-1">
                                +Mod: {calcularValorConModificadores(personaje, 'salvaciones.fortaleza')}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-xs text-gray-600 mb-1">Reflejos</div>
                            <input
                              type="number"
                              value={personaje.salvaciones.reflejos}
                              onChange={(e) => updatePersonajeField(personaje.id, 'salvaciones.reflejos', e.target.value)}
                              className="w-full border-2 border-orange-300 rounded-lg p-2 text-center font-bold"
                            />
                            {personaje.bonusMalus.some(bm => bm.campos.includes('salvaciones.reflejos')) && (
                              <div className="text-xs text-center text-orange-600 mt-1">
                                +Mod: {calcularValorConModificadores(personaje, 'salvaciones.reflejos')}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-xs text-gray-600 mb-1">Voluntad</div>
                            <input
                              type="number"
                              value={personaje.salvaciones.voluntad}
                              onChange={(e) => updatePersonajeField(personaje.id, 'salvaciones.voluntad', e.target.value)}
                              className="w-full border-2 border-orange-300 rounded-lg p-2 text-center font-bold"
                            />
                            {personaje.bonusMalus.some(bm => bm.campos.includes('salvaciones.voluntad')) && (
                              <div className="text-xs text-center text-orange-600 mt-1">
                                +Mod: {calcularValorConModificadores(personaje, 'salvaciones.voluntad')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Ataques */}
                      <div className="bg-white p-3 rounded-lg shadow-sm md:col-span-2">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-semibold text-gray-700">Ataques</label>
                          <button
                            onClick={() => addAtaqueToPersonaje(personaje.id)}
                            className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded font-bold"
                          >
                            + Ataque
                          </button>
                        </div>
                        <div className="space-y-2">
                          {personaje.ataques.map(ataque => {
                            const bonusAtaqueCampo = `ataques.${ataque.id}.bonusAtaque`;
                            const constanteCampo = `ataques.${ataque.id}.constante`;
                            const tieneBonusAtaque = personaje.bonusMalus.some(bm => bm.campos.includes(bonusAtaqueCampo));
                            const tieneConstante = personaje.bonusMalus.some(bm => bm.campos.includes(constanteCampo));

                            return (
                              <div key={ataque.id} className="p-2 bg-gray-50 rounded border border-gray-300">
                                <div className="flex items-center gap-2 mb-2">
                                  <input
                                    type="text"
                                    value={ataque.nombre}
                                    onChange={(e) => updateAtaque(personaje.id, ataque.id, 'nombre', e.target.value)}
                                    className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm font-semibold"
                                    placeholder="Nombre"
                                  />
                                  <button
                                    onClick={() => removeAtaqueFromPersonaje(personaje.id, ataque.id)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className="text-xs text-gray-600">+Atk:</span>
                                  <input
                                    type="text"
                                    value={ataque.bonusAtaque}
                                    onChange={(e) => updateAtaque(personaje.id, ataque.id, 'bonusAtaque', e.target.value)}
                                    className="w-12 border border-gray-300 rounded px-1 py-1 text-xs text-center"
                                    placeholder="3"
                                  />
                                  {tieneBonusAtaque && (
                                    <span className="text-xs text-blue-600 font-semibold">
                                      ({calcularValorConModificadores(personaje, bonusAtaqueCampo)})
                                    </span>
                                  )}
                                  <span className="text-xs text-gray-600 ml-2">Daño:</span>
                                  <input
                                    type="text"
                                    value={ataque.dado || ''}
                                    onChange={(e) => updateAtaque(personaje.id, ataque.id, 'dado', e.target.value)}
                                    className="w-16 border border-gray-300 rounded px-1 py-1 text-xs"
                                    placeholder="1d8"
                                  />
                                  <span className="text-xs">+</span>
                                  <input
                                    type="text"
                                    value={ataque.constante || ''}
                                    onChange={(e) => updateAtaque(personaje.id, ataque.id, 'constante', e.target.value)}
                                    className="w-12 border border-gray-300 rounded px-1 py-1 text-xs text-center"
                                    placeholder="3"
                                  />
                                  {tieneConstante && (
                                    <span className="text-xs text-blue-600 font-semibold">
                                      ({calcularValorConModificadores(personaje, constanteCampo)})
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Bonus/Malus */}
                      <div className="bg-white p-3 rounded-lg shadow-sm md:col-span-2">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-semibold text-gray-700">Modificadores Activos</label>
                          <button
                            onClick={() => openBonusMalusModal(personaje.id)}
                            className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded font-bold"
                          >
                            + Bonus/Malus
                          </button>
                        </div>
                        <div className="space-y-1">
                          {personaje.bonusMalus.length === 0 ? (
                            <div className="text-xs text-gray-500 italic">Sin modificadores</div>
                          ) : (
                            personaje.bonusMalus.map(bm => (
                              <div key={bm.id} className={'flex items-center justify-between p-2 rounded text-sm ' +
                                (bm.tipo === 'bonus' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
                                <div>
                                  <span className="font-semibold">{bm.nombre}</span>
                                  <span className="ml-2">({bm.valor > 0 ? '+' : ''}{bm.valor})</span>
                                  <div className="text-xs opacity-75">
                                    {bm.campos.map(c => getFieldLabel(c, personaje)).join(', ')}
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeBonusMalus(personaje.id, bm.id)}
                                  className="hover:opacity-75"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal Añadir Personaje */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full my-8 max-h-screen overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">Añadir Personaje/Monstruo</h2>

              <div className="space-y-4">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-semibold mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-lg p-2"
                    placeholder="Nombre del personaje"
                  />
                </div>

                {/* PG */}
                <div>
                  <label className="block text-sm font-semibold mb-1">Puntos de Vida Totales</label>
                  <input
                    type="number"
                    value={formData.pg.totales}
                    onChange={(e) => setFormData({
                      ...formData,
                      pg: { ...formData.pg, totales: e.target.value, actuales: e.target.value }
                    })}
                    className="w-full border-2 border-gray-300 rounded-lg p-2"
                    placeholder="PG Totales"
                  />
                </div>

                {/* CA */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Clase de Armadura</label>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      value={formData.ca.normal}
                      onChange={(e) => setFormData({ ...formData, ca: { ...formData.ca, normal: e.target.value } })}
                      className="border-2 border-gray-300 rounded-lg p-2"
                      placeholder="Normal"
                    />
                    <input
                      type="number"
                      value={formData.ca.toque}
                      onChange={(e) => setFormData({ ...formData, ca: { ...formData.ca, toque: e.target.value } })}
                      className="border-2 border-gray-300 rounded-lg p-2"
                      placeholder="Toque"
                    />
                    <input
                      type="number"
                      value={formData.ca.desprevenido}
                      onChange={(e) => setFormData({ ...formData, ca: { ...formData.ca, desprevenido: e.target.value } })}
                      className="border-2 border-gray-300 rounded-lg p-2"
                      placeholder="Despreven."
                    />
                  </div>
                </div>

                {/* Iniciativa */}
                <div>
                  <label className="block text-sm font-semibold mb-1">Modificador de Iniciativa</label>
                  <input
                    type="number"
                    value={formData.iniciativa}
                    onChange={(e) => setFormData({ ...formData, iniciativa: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-lg p-2"
                    placeholder="+Iniciativa"
                  />
                </div>

                {/* Salvaciones */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Salvaciones</label>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      value={formData.salvaciones.fortaleza}
                      onChange={(e) => setFormData({ ...formData, salvaciones: { ...formData.salvaciones, fortaleza: e.target.value } })}
                      className="border-2 border-gray-300 rounded-lg p-2"
                      placeholder="Fort"
                    />
                    <input
                      type="number"
                      value={formData.salvaciones.reflejos}
                      onChange={(e) => setFormData({ ...formData, salvaciones: { ...formData.salvaciones, reflejos: e.target.value } })}
                      className="border-2 border-gray-300 rounded-lg p-2"
                      placeholder="Ref"
                    />
                    <input
                      type="number"
                      value={formData.salvaciones.voluntad}
                      onChange={(e) => setFormData({ ...formData, salvaciones: { ...formData.salvaciones, voluntad: e.target.value } })}
                      className="border-2 border-gray-300 rounded-lg p-2"
                      placeholder="Vol"
                    />
                  </div>
                </div>

                {/* Ataques */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Ataques</label>

                  {/* Lista de ataques agregados */}
                  {formData.ataques.length > 0 && (
                    <div className="mb-3 space-y-2">
                      {formData.ataques.map(ataque => (
                        <div key={ataque.id} className="flex items-center gap-2 p-2 bg-gray-100 rounded">
                          <span className="flex-1 text-sm">
                            {ataque.nombre}: +{ataque.bonusAtaque} | {ataque.dado}{ataque.constante ? '+' + ataque.constante : ''}
                          </span>
                          <button
                            onClick={() => removeAtaqueFromForm(ataque.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Formulario para añadir ataque */}
                  <div className="space-y-2 p-3 bg-gray-50 rounded border border-gray-300">
                    <input
                      type="text"
                      value={currentAtaque.nombre}
                      onChange={(e) => setCurrentAtaque({ ...currentAtaque, nombre: e.target.value })}
                      className="w-full border border-gray-300 rounded p-2 text-sm"
                      placeholder="Nombre del ataque"
                    />
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="text-xs text-gray-600">+Atk</label>
                        <input
                          type="text"
                          value={currentAtaque.bonusAtaque}
                          onChange={(e) => setCurrentAtaque({ ...currentAtaque, bonusAtaque: e.target.value })}
                          className="w-full border border-gray-300 rounded p-2 text-sm"
                          placeholder="3"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-gray-600">Dado</label>
                        <input
                          type="text"
                          value={currentAtaque.dado}
                          onChange={(e) => setCurrentAtaque({ ...currentAtaque, dado: e.target.value })}
                          className="w-full border border-gray-300 rounded p-2 text-sm"
                          placeholder="1d8"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">+Const</label>
                        <input
                          type="text"
                          value={currentAtaque.constante}
                          onChange={(e) => setCurrentAtaque({ ...currentAtaque, constante: e.target.value })}
                          className="w-full border border-gray-300 rounded p-2 text-sm"
                          placeholder="3"
                        />
                      </div>
                    </div>
                    <button
                      onClick={addAtaqueToForm}
                      className="w-full bg-green-500 hover:bg-green-600 text-white rounded p-2 text-sm font-bold"
                    >
                      + Añadir Ataque
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAddPersonaje}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  Añadir
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Bonus/Malus */}
        {showBonusMalusModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Añadir Bonus/Malus</h2>

              <div className="space-y-4">
                {/* Tipo */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Tipo</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBonusMalusForm({ ...bonusMalusForm, tipo: 'bonus' })}
                      className={'flex-1 px-4 py-2 rounded font-semibold ' +
                        (bonusMalusForm.tipo === 'bonus' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700')}
                    >
                      Bonus
                    </button>
                    <button
                      onClick={() => setBonusMalusForm({ ...bonusMalusForm, tipo: 'malus' })}
                      className={'flex-1 px-4 py-2 rounded font-semibold ' +
                        (bonusMalusForm.tipo === 'malus' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700')}
                    >
                      Malus
                    </button>
                  </div>
                </div>

                {/* Nombre */}
                <div>
                  <label className="block text-sm font-semibold mb-1">Nombre</label>
                  <input
                    type="text"
                    value={bonusMalusForm.nombre}
                    onChange={(e) => setBonusMalusForm({ ...bonusMalusForm, nombre: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-lg p-2"
                    placeholder="Ej: Bendición, Ceguera, etc."
                  />
                </div>

                {/* Valor */}
                <div>
                  <label className="block text-sm font-semibold mb-1">Valor</label>
                  <input
                    type="number"
                    value={bonusMalusForm.valor}
                    onChange={(e) => setBonusMalusForm({ ...bonusMalusForm, valor: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-lg p-2"
                    placeholder="Valor numérico"
                  />
                </div>

                {/* Campos afectados */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Campos Afectados</label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {/* Campos estáticos */}
                    {[
                      { label: 'Iniciativa', value: 'iniciativa' },
                      { label: 'CA Normal', value: 'ca.normal' },
                      { label: 'CA Toque', value: 'ca.toque' },
                      { label: 'CA Desprevenido', value: 'ca.desprevenido' },
                      { label: 'Salvación Fortaleza', value: 'salvaciones.fortaleza' },
                      { label: 'Salvación Reflejos', value: 'salvaciones.reflejos' },
                      { label: 'Salvación Voluntad', value: 'salvaciones.voluntad' }
                    ].map(campo => (
                      <label key={campo.value} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={bonusMalusForm.campos.includes(campo.value)}
                          onChange={() => toggleCampo(campo.value)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">{campo.label}</span>
                      </label>
                    ))}

                    {/* Campos dinámicos de ataques - Bonus/Malus para cada ataque */}
                    {(() => {
                      const personaje = personajes.find(p => p.id === bonusMalusForm.personajeId);
                      console.log('Personaje en modal:', personaje);
                      console.log('Ataques del personaje:', personaje?.ataques);
                      return bonusMalusForm.personajeId && personaje?.ataques?.map(ataque => (
                        <div key={ataque.id} className="border-t pt-2 mt-2">
                          <div className="text-xs font-semibold text-gray-600 mb-1">{ataque.nombre || 'Ataque sin nombre'}</div>
                        <label className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={bonusMalusForm.campos.includes(`ataques.${ataque.id}.bonusAtaque`)}
                            onChange={() => toggleCampo(`ataques.${ataque.id}.bonusAtaque`)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">Bonus Ataque</span>
                        </label>
                        <label className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={bonusMalusForm.campos.includes(`ataques.${ataque.id}.constante`)}
                            onChange={() => toggleCampo(`ataques.${ataque.id}.constante`)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">Daño (Constante)</span>
                        </label>
                      </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={aplicarBonusMalus}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  Aplicar
                </button>
                <button
                  onClick={() => setShowBonusMalusModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Confirmar Eliminación */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4 text-red-600">Eliminar Personaje</h2>
              <p className="mb-6">¿Seguro que quieres eliminar este personaje?</p>
              <div className="flex gap-3">
                <button
                  onClick={confirmarEliminacion}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
                >
                  Sí, eliminar
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteTargetId(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Limpiar Todos los Datos */}
        {showClearDataModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4 text-red-600">⚠️ Limpiar Todos los Datos</h2>
              <p className="mb-4 font-semibold">¿Estás seguro que quieres eliminar TODOS los personajes?</p>
              <p className="mb-6 text-sm text-gray-600">Esta acción no se puede deshacer. Se perderán todos los datos guardados.</p>
              <div className="flex gap-3">
                <button
                  onClick={limpiarTodosDatos}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
                >
                  Sí, eliminar todo
                </button>
                <button
                  onClick={() => setShowClearDataModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataTab;
