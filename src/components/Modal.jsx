import { useState } from 'react'
import '../assets/styles/_modal.scss'
import championsData from '../assets/data/champions.json'
import traitsData from '../assets/data/traits.json'

export default function Modal({ comp, setComps, onClose }) {
    const [isCatalogOpen, setIsCatalogOpen] = useState(true)

    const coreUnits = comp.coreUnits || comp.main || []
    const flexZones = comp.flexZones || [{ id: 'default-flex', units: [] }]

    // --- SYNERGIES ---
    const calculateSynergies = () => {
        const counts = {}
        const uniqueIds = new Set()

        if (Array.isArray(coreUnits)) {
            coreUnits.forEach(unit => {
                if (unit && unit.id && !uniqueIds.has(unit.id)) {
                    uniqueIds.add(unit.id)
                    if (Array.isArray(unit.traits)) {
                        unit.traits.forEach(traitId => {
                            const normalizedTrait = traitId.toLowerCase().trim()
                            counts[normalizedTrait] = (counts[normalizedTrait] || 0) + 1
                        })
                    }
                }
            })
        }

        const safeTraitsData = Array.isArray(traitsData) ? traitsData : []

        return Object.keys(counts).map(traitId => {
            const traitInfo = safeTraitsData.find(t => t.id.toLowerCase().trim() === traitId)
            if (!traitInfo || !Array.isArray(traitInfo.thresholds)) return null

            const count = counts[traitId]
            const thresholdIndex = traitInfo.thresholds.reduce((acc, threshold, index) => {
                return count >= Number(threshold) ? index : acc
            }, -1)

            const styles = ['bronze', 'silver', 'gold', 'prisma']
            const style = thresholdIndex >= 0 ? (styles[thresholdIndex] ?? 'prisma') : 'none'
            return { ...traitInfo, count: count, style: style, isActive: style !== 'none' }
        })
            .filter(t => t !== null)
            .sort((a, b) => (a.isActive === b.isActive) ? b.count - a.count : a.isActive ? -1 : 1)
    }

    const activeSynergies = calculateSynergies()

    // --- NOM & STRAT ---
    const handleStrategyChange = (field, value) => {
        setComps(prev => prev.map(c => c.id === comp.id ? { ...c, [field]: value } : c))
    }

    // --- DRAG & DROP ---
    const handleDragStart = (e, champ) => {
        e.dataTransfer.setData("champion", JSON.stringify(champ))
    }

    const handleDragOver = (e) => {
        e.preventDefault()
    }

    const handleDrop = (e, targetZone, flexId = null) => {
        e.preventDefault()
        const champData = e.dataTransfer.getData("champion")
        if (!champData) return

        const champ = JSON.parse(champData)
        const newUnit = { ...champ, uid: Math.random().toString() }

        setComps(prevComps => prevComps.map(c => {
            if (c.id !== comp.id) return c

            if (targetZone === 'core') {
                return { ...c, coreUnits: [...(c.coreUnits || []), newUnit] }
            }
            else if (targetZone === 'flex') {
                const currentFlexZones = c.flexZones || flexZones
                const updatedFlex = currentFlexZones.map(fz =>
                    fz.id === flexId ? { ...fz, units: [...fz.units, newUnit] } : fz
                )
                return { ...c, flexZones: updatedFlex }
            }
            return c
        }))
    }

    // --- SUPPR UNIT ---
    const handleRemoveUnit = (uid, zoneType, flexId = null) => {
        setComps(prevComps => prevComps.map(c => {
            if (c.id !== comp.id) return c

            if (zoneType === 'core') {
                return { ...c, coreUnits: c.coreUnits.filter(u => u.uid !== uid) }
            } else if (zoneType === 'flex') {
                const updatedFlex = c.flexZones.map(fz =>
                    fz.id === flexId ? { ...fz, units: fz.units.filter(u => u.uid !== uid) } : fz
                )
                return { ...c, flexZones: updatedFlex }
            }
            return c
        }))
    }

    // --- GESTION FLEX ---
    const handleAddFlexZone = () => {
        setComps(prevComps => prevComps.map(c => {
            if (c.id !== comp.id) return c
            const newZone = { id: Date.now().toString(), units: [] }
            return { ...c, flexZones: [...(c.flexZones || flexZones), newZone] }
        }))
    }

    const handleRemoveFlexZone = (flexId) => {
        setComps(prevComps => prevComps.map(c => {
            if (c.id !== comp.id) return c
            return { ...c, flexZones: c.flexZones.filter(fz => fz.id !== flexId) }
        }))
    }

    // --- TRI ---
    const sortedChampions = [...championsData].sort((a, b) => {
        if (a.cost !== b.cost) {
            return a.cost - b.cost
        }
        return a.name.localeCompare(b.name)
    })

    return (
        <div className='modal'>
            <div className='modal__content' onClick={(e) => e.stopPropagation()}>
                <button className='modal__content__close' onClick={onClose}>&times;</button>
                <div className='modal__scroll-area'>
                    <div className='modal__content__head'>
                        <input
                            type='text'
                            className='modal__content__head__name-input'
                            value={comp.name}
                            onChange={(e) => handleStrategyChange('name', e.target.value)}
                        />
                    </div>

                    <div className='modal__content__board'>
                        <div
                            className='board-zone core-zone'
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, 'core')}
                        >
                            <h3 className='board-zone__title'>Core Units</h3>
                            <div className='board-zone__grid'>
                                {coreUnits.map(unit => (
                                    <img
                                        key={unit.uid}
                                        src={`/assets/champions/${unit.id}.png`}
                                        className={`board-unit cost-${unit.cost}`}
                                        alt={unit.name}
                                        onClick={() => handleRemoveUnit(unit.uid, 'core')}
                                    />
                                ))}
                                {coreUnits.length === 0 && <span className='placeholder'>Drop your units here</span>}
                            </div>
                        </div>

                        <div className='flex-container'>
                            {flexZones.map((fz, index) => (
                                <div
                                    key={fz.id}
                                    className='board-zone flex-zone'
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, 'flex', fz.id)}
                                >
                                    <div className='flex-zone__header'>
                                        <h3 className='board-zone__title'>Flex {index + 1}</h3>
                                        <button className='btn-remove-flex' onClick={() => handleRemoveFlexZone(fz.id)}>&times;</button>
                                    </div>
                                    <div className='board-zone__grid'>
                                        {fz.units.map(unit => (
                                            <img
                                                key={unit.uid}
                                                src={`/assets/champions/${unit.id}.png`}
                                                className={`board-unit cost-${unit.cost} small`}
                                                alt={unit.name}
                                                onClick={() => handleRemoveUnit(unit.uid, 'flex', fz.id)}
                                            />
                                        ))}
                                        {fz.units.length === 0 && <span className='placeholder'>Drop</span>}
                                    </div>
                                </div>
                            ))}

                            <button className='btn-add-flex' onClick={handleAddFlexZone}>
                                Add Flex
                            </button>
                        </div>
                    </div>

                    <div className={`modal__content__catalog ${isCatalogOpen ? 'is-open' : ''}`}>
                        <div className='catalog-header' onClick={() => setIsCatalogOpen(!isCatalogOpen)}>
                            <h3>Units</h3>
                            <span className={`arrow ${isCatalogOpen ? 'up' : 'down'}`}>▼</span>
                        </div>

                        <div className='wrapper'>
                            <div className='units'>
                                {sortedChampions.map(champ => (
                                    <div
                                        key={champ.id}
                                        className='units__card'
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, champ)}
                                    >
                                        <img
                                            src={`/assets/champions/${champ.id}.png`}
                                            alt={champ.name}
                                            className={`cost-${champ.cost}`}
                                        />
                                        <span className='units__card__name'>{champ.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className='modal__content__synergies'>
                        {activeSynergies.map(syn => (
                            <div
                                key={syn.id}
                                className={`synergy-tag ${syn.style}`}
                            >
                                <div className='synergy-tag__icon'>
                                    <img src={`/assets/traits/${syn.id}.svg`} alt={syn.name} />
                                </div>
                                <span className='synergy-tag__count'>{syn.count}</span>
                            </div>
                        ))}
                    </div>

                    <div className='modal__content__strat'>
                        <div className='strat'>
                            <h3>Augment Priority</h3>
                            <div className='strat__augment'>
                                {['eco', 'board', 'items'].map(type => (
                                    <button
                                        key={type}
                                        className={`augment-btn ${comp.augmentPriority === type ? 'active' : ''}`} onClick={() => handleStrategyChange('augmentPriority', type)}
                                    >
                                        {type.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className='strat stages-grid'>
                            {['stage2', 'stage3', 'stage4'].map(st => (
                                <div key={st} className='stage-block'>
                                    <h4>{st.replace('stage', 'Stage ')}</h4>
                                    <textarea
                                        placeholder='what about..'
                                        value={comp[st] || ''}
                                        onChange={(e) => handleStrategyChange(st, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className='strat'>
                            <h3>Tips</h3>
                            <textarea
                                className='tips-area'
                                placeholder='Right tips there...'
                                value={comp.tips || ''}
                                onChange={(e) => handleStrategyChange('tips', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className='modal__content__footer'>
                        <button className='btn-save' onClick={onClose}>SAVE</button>
                    </div>
                </div>
            </div>
        </div>
    )
}