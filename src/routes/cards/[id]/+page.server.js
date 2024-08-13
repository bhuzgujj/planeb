import { error } from '@sveltejs/kit';
import {getCardSetById} from "$lib/gateway.js";

export function load({ params }) {
    const cardSet = getCardSetById(params.id)
    if (!cardSet) {
        throw error(404, {
            message: "Card set not found"
        });
    }
    return {
        id: params.id,
        cardSet
    };
}