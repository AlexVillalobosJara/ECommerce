export const getFlagUrl = (country?: string) => {
    if (!country) return ""
    const codeMap: Record<string, string> = {
        "chile": "cl",
        "argentina": "ar",
        "perú": "pe",
        "peru": "pe",
        "colombia": "co",
        "méxico": "mx",
        "mexico": "mx",
        "españa": "es",
        "united states": "us",
        "eeuu": "us",
        "bolivia": "bo",
        "ecuador": "ec",
        "uruguay": "uy",
        "paraguay": "py",
        "brasil": "br",
        "brazil": "br",
    }
    const code = codeMap[country.toLowerCase()] || "cl"
    return `https://flagcdn.com/w40/${code}.png`
}
