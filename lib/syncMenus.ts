import { supabase } from './supabase';
import { SavedMenu } from '../types';

export const syncMenusToCloud = async (userEmail: string, menus: SavedMenu[]) => {
    if (!userEmail) return;

    try {
        const rows = menus.map(menu => ({
            user_email: userEmail,
            menu_id: menu.id,
            menu_data: menu,
            updated_at: new Date().toISOString()
        }));

        if (rows.length === 0) return;

        const { error } = await supabase
            .from('user_menus')
            .upsert(rows, { onConflict: 'user_email,menu_id' });

        if (error) {
            console.warn('Sync to cloud warning (Table might not exist yet):', error.message);
        }
    } catch (err) {
        console.warn('Sync to cloud failed:', err);
    }
};

export const fetchMenusFromCloud = async (userEmail: string): Promise<SavedMenu[] | null> => {
    if (!userEmail) return null;

    try {
        const { data, error } = await supabase
            .from('user_menus')
            .select('menu_data')
            .eq('user_email', userEmail);

        if (error) {
            console.warn('Fetch from cloud warning:', error.message);
            return null;
        }

        if (data && data.length > 0) {
            return data.map(row => row.menu_data as SavedMenu).sort((a, b) => b.createdAt - a.createdAt);
        }
        return null;
    } catch (err) {
        console.warn('Fetch from cloud failed:', err);
        return null;
    }
};

export const deleteMenuFromCloud = async (userEmail: string, menuId: string) => {
    if (!userEmail || !menuId) return;

    try {
        const { error } = await supabase
            .from('user_menus')
            .delete()
            .eq('user_email', userEmail)
            .eq('menu_id', menuId);

        if (error) {
            console.warn('Delete from cloud warning:', error.message);
        }
    } catch (err) {
        console.warn('Delete from cloud failed:', err);
    }
};
