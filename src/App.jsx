import { useState, useEffect } from 'react';
import './assets/styles/base.scss';
import Background from './components/Background';
import Sidebar from './components/Sidebar';
import Modal from './components/Modal';

function App() {

  const [comps, setComps] = useState(() => {
    const savedComps = localStorage.getItem('mastertft_comps')
    return savedComps ? JSON.parse(savedComps) : []
  })

  const [activeCompId, setActiveCompId] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem('mastertft_comps', JSON.stringify(comps))
  }, [comps])

  const openComp = (id) => {
    setActiveCompId(id)
    setIsModalOpen(true)
  }


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
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const importedComps = JSON.parse(event.target.result)
        if (Array.isArray(importedComps)) {
          setComps(importedComps)
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
      localStorage.removeItem('mastertft_comps')
      setActiveCompId(null)
      setIsModalOpen(false)
    }
  }

  const activeComp = comps.find(c => c.id === activeCompId);

  return (
    <>
      <Background />
      <div className='shell'>
        <Sidebar
          comps={comps}
          activeCompId={activeCompId}
          onCreateComp={handleCreateComp}
          onSelectComp={openComp}
          onImport={handleImport}
          onExport={handleExport}
          onResetBdd={handleResetBdd}
        />

        <div className='main'>
          <div className='main__title'>
            <h1>MasterTFT</h1>
            <p>v0.1</p>
          </div>
          {comps.length === 0 ? (
            <div className='empty-state'>
              <p>Create a comp to start</p>
            </div>
          ) : (
            <div className='main__grid'>
              {comps.map(comp => {
                const headliner = comp.coreUnits && comp.coreUnits.length > 0 ? comp.coreUnits[0] : null;
                return (
                  <div key={comp.id} className='main__grid__card' onClick={() => openComp(comp.id)}>
                    {headliner && (
                      <img src={`/assets/champions/${headliner.id}.png`} alt={headliner.name} className='card-bg' />
                    )}
                    <div className='card-info'>
                      <h3>{comp.name}</h3>
                    </div>
                    <button className='btn-delete' onClick={(e) => handleDeleteComp(e, comp.id)}>&times;</button>
                  </div>
                )
              })}
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