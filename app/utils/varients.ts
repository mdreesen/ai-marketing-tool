export const formVarient = () => {
    return {
        initial: { opacity: 0, y: 50 },
        enter: {
            opacity: 1,
            y: 0,
            transition: {
                type: 'spring',
                stiffness: 250,
                damping: 25,
                mass: 0.5,
                staggerChildren: 0.1,
                delayChildren: 0.1,
            },
        },
    };
};

export const containerVarient = () => {
    return {
        initial: { opacity: 0, y: -20 },
        enter: { opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.8 } }
    };
};

export const itemVarient = () => {
    return {
        initial: { opacity: 0, y: -20 },
        enter: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 250, damping: 25, mass: 0.5, staggerChildren: 0.05 } }
    };
};

export const inputVarient = () => {
    return {
        initial: { opacity: 0, y: 20 }, enter: { opacity: 1, y: 0 }
    };
};

export const navVarient = () => {
    return {
        initial: { opacity: 0, y: -50 },
        enter: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 250, damping: 25, mass: 0.5 } }
    };
};

export const navMenuVarient = () => {
    return {
        initial: { opacity: 0, y: -20 },
        enter: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 250, damping: 25, mass: 0.5, staggerChildren: 0.05 } }
    };
};