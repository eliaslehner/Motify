// Challenge helper utilities for status checks and formatting

/**
 * Check if a challenge is upcoming (hasn't started yet)
 */
export function isChallengeUpcoming(startDate: Date | bigint): boolean {
    const startTime = typeof startDate === 'bigint'
        ? Number(startDate) * 1000
        : startDate.getTime();
    return startTime > Date.now();
}

/**
 * Check if a challenge is currently active
 */
export function isChallengeActive(startDate: Date | bigint, endDate: Date | bigint): boolean {
    const now = Date.now();
    const startTime = typeof startDate === 'bigint'
        ? Number(startDate) * 1000
        : startDate.getTime();
    const endTime = typeof endDate === 'bigint'
        ? Number(endDate) * 1000
        : endDate.getTime();
    return startTime <= now && endTime > now;
}

/**
 * Check if a challenge has completed
 */
export function isChallengeCompleted(endDate: Date | bigint): boolean {
    const endTime = typeof endDate === 'bigint'
        ? Number(endDate) * 1000
        : endDate.getTime();
    return endTime <= Date.now();
}

/**
 * Calculate and format the duration between two dates
 */
export function calculateDuration(start: Date, end: Date): string {
    const diffMs = end.getTime() - start.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0 && hours > 0) {
        return `${days}d ${hours}h`;
    } else if (days > 0) {
        return `${days} ${days === 1 ? 'day' : 'days'}`;
    } else if (hours > 0) {
        return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    }
    return '< 1h';
}

/**
 * Format a bigint timestamp into a readable date string
 */
export function formatTimestamp(timestamp: bigint): string {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Format duration for display (time remaining or completed status)
 */
export function formatDuration(startTime: bigint, endTime: bigint): string {
    const now = BigInt(Math.floor(Date.now() / 1000));

    if (now < startTime) {
        const secondsUntilStart = Number(startTime - now);
        const daysUntilStart = Math.ceil(secondsUntilStart / (24 * 60 * 60));
        const hoursUntilStart = Math.ceil(secondsUntilStart / (60 * 60));

        if (daysUntilStart > 1) {
            return `Starts in ${daysUntilStart} day${daysUntilStart !== 1 ? 's' : ''}`;
        } else if (hoursUntilStart > 1) {
            return `Starts in ${hoursUntilStart} hour${hoursUntilStart !== 1 ? 's' : ''}`;
        } else {
            const minutesUntilStart = Math.ceil(secondsUntilStart / 60);
            return `Starts in ${minutesUntilStart} minute${minutesUntilStart !== 1 ? 's' : ''}`;
        }
    }

    if (now > endTime) {
        return 'Completed';
    }

    const secondsLeft = Number(endTime - now);
    const daysLeft = Math.ceil(secondsLeft / (24 * 60 * 60));
    const hoursLeft = Math.ceil(secondsLeft / (60 * 60));

    if (daysLeft > 1) {
        return `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`;
    } else if (hoursLeft > 1) {
        return `${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''} left`;
    } else {
        const minutesLeft = Math.ceil(secondsLeft / 60);
        return `${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''} left`;
    }
}
