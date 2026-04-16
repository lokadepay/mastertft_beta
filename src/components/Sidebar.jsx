export default function Sidebar({ comps, activeCompId, onCreateComp, onSelectComp, onResetBdd, onImport, onExport }) {

    return (
        <div className="sidebar">
            <div className="sidebar__head">
                <h2>comp list</h2>
            </div>

            <div className="sidebar__list">
                {comps.map(comp => (
                    <div
                        key={comp.id}
                        className={`sidebar__item ${activeCompId === comp.id ? 'active' : ''}`}
                        onClick={() => onSelectComp(comp.id)}
                    >
                        {comp.name}
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