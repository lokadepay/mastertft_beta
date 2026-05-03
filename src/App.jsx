import { useState, useEffect } from 'react';
import './assets/styles/base.scss';
import Background from './components/Background';
import Sidebar from './components/Sidebar';
import Modal from './components/Modal';
import { calculateSynergies } from './utils/Synergies';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPen, faTrash } from '@fortawesome/free-solid-svg-icons';

function App() {

  const [comps, setComps] = useState(() => {
    const savedComps = localStorage.getItem('mastertft_comps')
    return savedComps ? JSON.parse(savedComps) : []
  })

  const [dbName, setDbName] = useState(() => {
    return localStorage.getItem('mastertft_dbname') || "New BDD"
  })

  const [activeCompId, setActiveCompId] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem('mastertft_comps', JSON.stringify(comps))
    localStorage.setItem('mastertft_dbname', dbName)
  }, [comps, dbName])

  const openComp = (id) => {
    setActiveCompId(id)
  }

  const editComp = () => {
    setIsModalOpen(true)
  }

  // ---COMP ACTIVE---
  const [viewFlexId, setViewFlexId] = useState(null)
  const activeComp = comps.find(c => c.id === activeCompId)

  useEffect(() => {
    if (activeComp?.flexZones?.length > 0) {
      if (!activeComp.flexZones.some(fz => fz.id === viewFlexId)) {
        setViewFlexId(activeComp.flexZones[0].id)
      }
    } else {
      setViewFlexId(null)
    }
  }, [activeComp, viewFlexId])


  // ---CREATION COMP ---
  const handleCreateComp = () => {
    const newComp = {
      id: Date.now().toString(),
      name: "New Comp",
      coreUnits: [],
      flexZones: [{ id: 'default-flex', units: [] }]
    }


    setComps([...comps, newComp])
    openComp(newComp.id)
  }

  // --- SUPPRESSION COMP ---
  const handleDeleteComp = (e, id) => {
    e.stopPropagation()
    if (window.confirm("Are you sure to delete this comp?")) {
      setComps(comps.filter(c => c.id !== id))
      if (activeCompId === id) setIsModalOpen(false)
    }
  }

  // --- EXPORT BDD ---
  const handleExport = async () => {
    if (comps.length === 0) {
      alert("Nothing to export")
      return
    }

    const jsonString = JSON.stringify(comps, null, 2)

    try {
      if (window.showSaveFilePicker) {
        const options = {
          suggestedName: 'comp-mastertft.json',
          type: [{
            description: 'Fichier JSON MasterTFT',
            accept: { 'application/json': ['.json'] },
          }]
        }
        const fileHandle = await window.showSaveFilePicker(options)
        const writable = await fileHandle.createWritable()
        await writable.write(jsonString)
        await writable.close()
      } else {
        const blob = new Blob([jsonString], { type: 'application/json' })

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'comp-mastertft.json'

        document.body.appendChild(link)
        link.click()

        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error("Error while saving", error)
        alert("Issues has come while saving comps")
      }
    }
  }


  // --- IMPORT JSON ---
  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const MAX_FILE_SIZE = 2 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      alert("This file is too large (Max 2MB)")
      e.target.value = null
      return
    }

    const fileName = file.name.replace('.json', '')
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const importedComps = JSON.parse(event.target.result)
        if (Array.isArray(importedComps)) {
          setComps(importedComps)
          setDbName(fileName)
        } else {
          alert("Not the right file")
        }
      } catch (err) {
        alert("Error while reading the file")
      }
    }
    reader.readAsText(file)
    e.target.value = null
  }

  // --- RESET BDD ---
  const handleResetBdd = () => {
    if (window.confirm("!WARNING! You're about to delete ALL your comps no saved. Are you sure?")) {
      setComps([])
      setDbName("New BDD")
      localStorage.removeItem('mastertft_comps')
      localStorage.removeItem('mastertft_dbname')
      setActiveCompId(null)
      setIsModalOpen(false)
    }
  }

  return (
    <>
      <Background />
      <div className='shell'>
        <Sidebar
          comps={comps}
          activeCompId={activeCompId}
          dbName={dbName}
          onCreateComp={handleCreateComp}
          onSelectComp={openComp}
          onImport={handleImport}
          onExport={handleExport}
          onResetBdd={handleResetBdd}
        />

        <div className='main'>
          <div className='main__title'>
            <h1>MasterTFT</h1>
            <p>v0.2</p>
          </div>
          {!activeComp ? (
            <div className='empty-state'>
              <p>Select a composition from the sidebar or create a new one</p>
            </div>
          ) : (
            <div className='comp-viewer'>

              <div className='comp-viewer__header'>
                <div className='comp-viewer__title'>
                  <h1>{activeComp.name}</h1>
                  {activeComp.augmentPriority && (
                    <span className='augment-badge'>{activeComp.augmentPriority.toUpperCase()}</span>
                  )}
                </div>

                <div className='header-actions'>
                  <button className='btn-action edit' onClick={editComp} title="Modifier la compo">
                    <FontAwesomeIcon icon={faPen} />
                  </button>
                  <button className='btn-action delete' onClick={(e) => handleDeleteComp(e, activeComp.id)} title="Supprimer la compo">
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>

              <div className='comp-viewer__synergies'>
                {calculateSynergies(activeComp.coreUnits, activeComp.flexZones, viewFlexId).map(syn => (
                  <div key={syn.id} className={`synergy-tooltip-wrapper ${syn.style}`}>
                    <div className='synergy-tag'>
                      <div className='synergy-tag__icon'>
                        <img src={`./assets/traits/${syn.id}.svg`} alt={syn.name} />
                      </div>
                      <span className='synergy-tag__count'>{syn.count}</span>
                    </div>

                    <div className='synergy-hover-details'>
                      <h4>{syn.name}</h4>
                      <p className='desc'>{syn.description || ""}</p>
                      <div className='synergy-thresholds'>
                        {syn.thresholds && syn.thresholds.map((thresh, idx) => {
                          const isActiveTier = idx === syn.activeIndex
                          const bonusTxt = syn.bonuses ? syn.bonuses[idx] : "Bonus"
                          return (
                            <div
                              key={idx}
                              className={`threshold ${isActiveTier ? 'active' : ''} `}
                            >
                              <span className='thresh-val'>{thresh}</span>
                              <p className='bonus-txt'>{bonusTxt}</p>
                            </div>
                          )
                        })}
                      </div>
                      <div className='synergy-champs'>
                        {syn.allUnits && syn.allUnits.map(u => {
                          const isOnBoard = syn.activeUnitsIds.includes(u.id)

                          return (
                            <img
                              key={u.uid}
                              src={`./assets/champions/${u.id}.png`}
                              alt={u.name}
                              className={`mini-champ cost-${u.cost} ${!isOnBoard ? 'not-on-board' : ''}`}
                              title={u.name}
                            />
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className='comp-viewer__board'>
                <div className='board-zone core-zone read-only'>
                  <h3 className='board-zone__title'>Core Units</h3>
                  <div className='board-zone__grid'>
                    {activeComp.coreUnits && activeComp.coreUnits.map(unit => (
                      <img
                        key={unit.uid}
                        src={`./assets/champions/${unit.id}.png`}
                        className={`board-unit cost-${unit.cost}`}
                        alt={unit.name}
                      />
                    ))}
                    {(!activeComp.coreUnits || activeComp.coreUnits.length === 0) &&
                      <span className='placeholder'>Aucun champion sélectionné</span>
                    }
                  </div>
                </div>

                <div className='flex-container'>
                  {activeComp.flexZones && activeComp.flexZones.map((fz, index) => (
                    <div
                      key={fz.id}
                      className={`board-zone flex-zone read-only ${viewFlexId === fz.id ? 'is-selected' : ''}`}
                      onClick={() => setViewFlexId(fz.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className='flex-zone__header'>
                        <h3 className='board-zone__title'>
                          Flex {index + 1}
                          {viewFlexId === fz.id && <span className='flex-zone__active-badge'>●</span>}
                        </h3>
                      </div>
                      <div className='board-zone__grid'>
                        {fz.units.map(unit => (
                          <img
                            key={unit.uid}
                            src={`./assets/champions/${unit.id}.png`}
                            className={`board-unit cost-${unit.cost} small`}
                            alt={unit.name}
                          />
                        ))}
                        {fz.units.length === 0 && <span className='placeholder'>Vide</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className='comp-viewer__strat'>
                <div className='stages-grid'>
                  {['stage2', 'stage3', 'stage4'].map(st => (
                    <div key={st} className='stage-block'>
                      <h4>{st.replace('stage', 'Stage ')}</h4>
                      <div className='read-only-text'>
                        <p>{activeComp[st] || 'Rien à signaler pour ce stage.'}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className='tips-block'>
                  <h4>Tips & Positionnement</h4>
                  <div className='read-only-text tips'>
                    <p>{activeComp.tips || 'Aucune astuce renseignée pour cette composition.'}</p>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      {isModalOpen && activeComp && (
        <Modal
          comp={activeComp}
          setComps={setComps}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  )
}

export default App