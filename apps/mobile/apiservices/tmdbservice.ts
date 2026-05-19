const API_URL = "http://10.0.2.2:8000";

import { supabase } from "../lib/supabase";

export async function searchMovies( query: string ) {
    const {
        data: { session },
    } = await supabase.auth.getSession();

    const response = await fetch(
        '$(API_URL)/external/tmdb/search?query=$(encodeURIComponent(query))&category=movie',
        {
            headers: {
                Authorization: 'Bearer $(session?.access_token)',
            },
        }
    );

    if ( !response.ok ) {
        throw new Error("Movie search failed.");
    }

    return response.json();

}