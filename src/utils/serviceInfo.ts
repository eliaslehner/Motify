// Service type information mappings for challenge services

export interface ServiceInfo {
    name: string;
    logo: string | null;
    color: string;
}

/**
 * Get service information (logo, color, name) based on service type
 */
export function getServiceInfo(serviceType: string): ServiceInfo {
    const normalizedType = serviceType.toLowerCase();

    switch (normalizedType) {
        case 'strava':
            return {
                name: 'STRAVA',
                logo: '/strava_logo.svg',
                color: 'bg-orange-500'
            };
        case 'github':
            return {
                name: 'GITHUB',
                logo: '/github-white.svg',
                color: 'bg-black'
            };
        case 'farcaster':
            return {
                name: 'FARCASTER',
                logo: '/farcaster-icon.svg',
                color: 'bg-purple-600'
            };
        case 'googlefit':
        case 'google-fit':
        case 'google_fit':
            return {
                name: 'GOOGLE FIT',
                logo: '/google-icon.png',
                color: 'bg-blue-500'
            };
        case 'wakatime':
            return {
                name: 'WAKATIME',
                logo: '/wakatime-icon.svg',
                color: 'bg-gray-800'
            };
        default:
            return {
                name: serviceType.toUpperCase(),
                logo: null,
                color: 'bg-primary'
            };
    }
}

/**
 * Check if the service is GitHub (special styling)
 */
export function isGithubService(serviceType: string): boolean {
    return serviceType.toLowerCase() === 'github';
}
