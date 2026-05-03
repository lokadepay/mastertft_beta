import { useState } from 'react'

export default function Sidebar({ comps, activeCompId, dbName, onCreateComp, onSelectComp, onResetBdd, onImport, onExport }) {

    const [folders, setFolders] = useState([
        {
            id: 'all',
            name: 'All Comps',
            isOpen: true
        }
    ])

    return (
        <div className="sidebar">
            <div className="sidebar__head">
                <h2>{dbName}</h2>
            </div>

            <div className="sidebar__list">
                {folders.map(folder => (
                    <div key={folder.id} className='folder'>
                        {/*<div className='folder__header'>
                            <h3>{folder.name}</h3>
                        </div>*/}

                        {folder.isOpen && (
                            <div className='folder__content'>
                                {comps.map(comp => {
                                    const headliner = comp.coreUnits?.[0] || null
                                    return (
                                        <div
                                            key={comp.id}
                                            className={`sidebar__card ${activeCompId === comp.id ? 'active' : ''}`}
                                            onClick={() => onSelectComp(comp.id)}
                                        >
                                            {headliner && (
                                                <img src={`./assets/champions/${headliner.id}.png`} alt={headliner.name} className='card-bg' />
                                            )}
                                            <div className='card-info'>
                                                <h4>{comp.name}</h4>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="sidebar__actions">
                <button className="btn-sidebar btn-add" onClick={onCreateComp}>
                    Add Comp
                </button>

                <button className="btn-sidebar btn-reset" onClick={onResetBdd}>
                    Reset Comps
                </button>

                <input type="file" id="import-file" style={{ display: "none" }} accept=".json" onChange={onImport} />
                <label htmlFor="import-file" className="btn-sidebar btn-import">Import Comps JSON</label>

                <button className="btn-sidebar btn-export" onClick={onExport}>
                    Export Comps JSON
                </button>
            </div>

        </div>
    )
}