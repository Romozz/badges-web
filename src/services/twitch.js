const API_URL = import.meta.env.VITE_API_URL || '';

export const fetchGlobalBadges = async () => {
    try {
        // Use our backend which caches the result
        const response = await fetch(`${API_URL}/api/badges`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const json = await response.json();
        // API now returns array directly, not { data: badges }
        return Array.isArray(json) ? json : [];
    } catch (error) {
        console.error("Failed to fetch badges from Backend API.", error);
        return [];
    }
};

export const getBadgeDescription = async (id) => {
    try {
        const res = await fetch(`${API_URL}/api/badges/${id}/description`);
        const data = await res.json();
        return data.description;
    } catch (error) {
        console.error("Failed to fetch description", error);
        return null;
    }
};

export const saveBadgeDescription = async (id, text) => {
    try {
        const res = await fetch(`${API_URL}/api/badges/${id}/description`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        return await res.json();
    } catch (error) {
        console.error("Failed to save description", error);
        throw error;
    }
};

export const saveBadgeImage = async (id, url) => {
    try {
        const res = await fetch(`/api/badges/${id}/images`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });
        return await res.json();
    } catch (error) {
        console.error("Failed to save image", error);
        throw error;
    }
};

export const deleteBadgeImage = async (id, url) => {
    try {
        const res = await fetch(`/api/badges/${id}/images`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });
        return await res.json();
    } catch (error) {
        console.error("Failed to delete image", error);
        throw error;
    }
};

export const saveBadgeAvailability = async (id, start, end) => {
    try {
        const res = await fetch(`${API_URL}/api/badges/${id}/availability`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ start, end })
        });
        return await res.json();
    } catch (error) {
        console.error("Failed to save availability", error);
        throw error;
    }
};

export const saveBadgeRelevance = async (id, isRelevant) => {
    try {
        const res = await fetch(`${API_URL}/api/badges/${id}/relevance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isRelevant })
        });
        return await res.json();
    } catch (error) {
        console.error("Failed to save relevance", error);
        throw error;
    }
};

export const saveBadgeCost = async (id, cost, amount) => {
    try {
        const res = await fetch(`${API_URL}/api/badges/${id}/cost`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cost, amount })
        });
        return await res.json();
    } catch (error) {
        console.error("Failed to save cost", error);
        throw error;
    }
};
