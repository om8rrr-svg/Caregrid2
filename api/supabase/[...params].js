
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY // Use service key for API endpoints
        );
        
        const { method, query, body } = req;
        const { table, ...params } = query;
        
        let result;
        
        switch (method) {
            case 'GET':
                if (params.id) {
                    result = await supabase
                        .from(table)
                        .select('*')
                        .eq('id', params.id)
                        .single();
                } else {
                    let query = supabase.from(table).select('*');
                    
                    // Apply filters
                    Object.entries(params).forEach(([key, value]) => {
                        if (key !== 'table' && value) {
                            query = query.eq(key, value);
                        }
                    });
                    
                    result = await query;
                }
                break;
                
            case 'POST':
                result = await supabase
                    .from(table)
                    .insert(body)
                    .select();
                break;
                
            case 'PUT':
                result = await supabase
                    .from(table)
                    .update(body)
                    .eq('id', params.id)
                    .select();
                break;
                
            case 'DELETE':
                result = await supabase
                    .from(table)
                    .delete()
                    .eq('id', params.id);
                break;
                
            default:
                return res.status(405).json({ error: 'Method not allowed' });
        }
        
        if (result.error) {
            return res.status(400).json({ error: result.error.message });
        }
        
        res.json({ data: result.data });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
