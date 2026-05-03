import traitsData from '../assets/data/traits.json'
import championsData from '../assets/data/champions.json'

export const calculateSynergies = (coreUnits, flexZones, selectedFlexId = null) => {
    const counts = {}
    const uniqueIds = new Set()
    const contributingUnits = {}

    const countUnitTraits = (unit) => {
        if (unit && unit.id && !uniqueIds.has(unit.id)) {
            uniqueIds.add(unit.id)
            if (Array.isArray(unit.traits)) {
                unit.traits.forEach(traitId => {
                    const normalizedTrait = traitId.toLowerCase().trim()
                    counts[normalizedTrait] = (counts[normalizedTrait] || 0) + 1
                    if (!contributingUnits[normalizedTrait]) {
                        contributingUnits[normalizedTrait] = []
                    }
                    contributingUnits[normalizedTrait].push(unit)
                })
            }
        }
    }

    if (Array.isArray(coreUnits)) coreUnits.forEach(countUnitTraits)

    if (selectedFlexId && flexZones) {
        const selectedFlex = flexZones.find(fz => fz.id === selectedFlexId)
        if (selectedFlex && Array.isArray(selectedFlex.units)) {
            selectedFlex.units.forEach(countUnitTraits)
        }
    } else if (flexZones) {
        flexZones.forEach(fz => fz.units.forEach(countUnitTraits))
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
        const allUnitsForTrait = championsData.filter(champ =>
            champ.traits && champ.traits.some(t => t.toLowerCase().trim() === traitId)
        ).sort((a, b) => a.cost - b.cost)
        const activeUnitsIds = contributingUnits[traitId] ? contributingUnits[traitId].map(u => u.id) : []
        return {
            ...traitInfo,
            count,
            style,
            isActive: style !== 'none',
            activeIndex: thresholdIndex,
            allUnits: allUnitsForTrait,
            activeUnitsIds
        }
    })
        .filter(t => t !== null)
        .sort((a, b) => (a.isActive === b.isActive) ? b.count - a.count : a.isActive ? -1 : 1)
}