var Storage={
    KEY:'francis_save',
    init:function(){},
    save:function(pet){
        if(!pet)return false;
        try{localStorage.setItem(this.KEY,JSON.stringify(pet));return true;}
        catch(e){console.warn('Save failed',e);return false;}
    },
    load:function(callback){
        try{
            var raw=localStorage.getItem(this.KEY);
            var data=raw?JSON.parse(raw):null;
            if(callback)callback(data);
            return data;
        }catch(e){if(callback)callback(null);return null;}
    },
    loadSync:function(){
        try{var raw=localStorage.getItem(this.KEY);return raw?JSON.parse(raw):null;}
        catch(e){return null;}
    },
    clear:function(){try{localStorage.removeItem(this.KEY);}catch(e){}}
};
