
const padStart = (nbr) => {
    return String(nbr).padStart(2, '0');
}

export const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours && hours > 0) {
        return `${padStart(hours)}:${padStart(minutes)}:${padStart(remainingSeconds)}`;
    }
    return `${padStart(minutes)}:${padStart(remainingSeconds)}`;
}
