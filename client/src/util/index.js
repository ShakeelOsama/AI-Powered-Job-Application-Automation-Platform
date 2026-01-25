export const getInitials = (name) => {
    if (!name) return 'U';
    return name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
};