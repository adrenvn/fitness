import { supabase } from './supabase.js';

export const api = {
  async getSiteContent() {
    const { data, error } = await supabase
      .from('site_content')
      .select('*');

    if (error) throw error;

    const contentMap = {};
    data.forEach(item => {
      if (!contentMap[item.section]) {
        contentMap[item.section] = {};
      }
      contentMap[item.section][item.key] = item.value;
    });

    return contentMap;
  },

  async updateSiteContent(section, key, value) {
    const { data, error } = await supabase
      .from('site_content')
      .upsert(
        { section, key, value, updated_at: new Date().toISOString() },
        { onConflict: 'section,key' }
      )
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getContacts() {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('type');

    if (error) throw error;
    return data;
  },

  async updateContact(id, contactData) {
    const { data, error } = await supabase
      .from('contacts')
      .update({ ...contactData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createContact(contactData) {
    const { data, error } = await supabase
      .from('contacts')
      .insert(contactData)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async deleteContact(id) {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getProgramCards() {
    const { data, error } = await supabase
      .from('program_cards')
      .select('*')
      .order('order_index');

    if (error) throw error;
    return data;
  },

  async createProgramCard(cardData) {
    const { data, error } = await supabase
      .from('program_cards')
      .insert(cardData)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateProgramCard(id, cardData) {
    const { data, error } = await supabase
      .from('program_cards')
      .update({ ...cardData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async deleteProgramCard(id) {
    const { error } = await supabase
      .from('program_cards')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getTeachers() {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .order('order_index');

    if (error) throw error;
    return data;
  },

  async createTeacher(teacherData) {
    const { data, error } = await supabase
      .from('teachers')
      .insert(teacherData)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateTeacher(id, teacherData) {
    const { data, error } = await supabase
      .from('teachers')
      .update({ ...teacherData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async deleteTeacher(id) {
    const { error } = await supabase
      .from('teachers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getReviews() {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('order_index');

    if (error) throw error;
    return data;
  },

  async createReview(reviewData) {
    const { data, error } = await supabase
      .from('reviews')
      .insert(reviewData)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateReview(id, reviewData) {
    const { data, error } = await supabase
      .from('reviews')
      .update({ ...reviewData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async deleteReview(id) {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getCompanyLogos() {
    const { data, error } = await supabase
      .from('company_logos')
      .select('*')
      .order('order_index');

    if (error) throw error;
    return data;
  },

  async createCompanyLogo(logoData) {
    const { data, error } = await supabase
      .from('company_logos')
      .insert(logoData)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateCompanyLogo(id, logoData) {
    const { data, error } = await supabase
      .from('company_logos')
      .update({ ...logoData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async deleteCompanyLogo(id) {
    const { error } = await supabase
      .from('company_logos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async uploadImage(file, path) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${path}-${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    return { path: fileName, publicUrl };
  },

  async deleteImage(path) {
    const { error } = await supabase.storage
      .from('images')
      .remove([path]);

    if (error) throw error;
  },

  getImageUrl(path) {
    if (!path) return null;

    const { data } = supabase.storage
      .from('images')
      .getPublicUrl(path);

    return data.publicUrl;
  },

  async getDocuments() {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('order_index');

    if (error) throw error;
    return data;
  },

  async createDocument(documentData) {
    const { data, error } = await supabase
      .from('documents')
      .insert(documentData)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateDocument(id, documentData) {
    const { data, error } = await supabase
      .from('documents')
      .update({ ...documentData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async deleteDocument(id) {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async uploadDocument(file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);

    return { path: fileName, publicUrl };
  },

  async deleteDocumentFile(path) {
    const { error } = await supabase.storage
      .from('documents')
      .remove([path]);

    if (error) throw error;
  }
};

export const auth = {
  async signIn(username, password) {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .eq('password_hash', password)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      throw new Error('Неверный логин или пароль');
    }

    sessionStorage.setItem('admin_user', JSON.stringify(data));
    return data;
  },

  async signOut() {
    sessionStorage.removeItem('admin_user');
  },

  async getUser() {
    const userStr = sessionStorage.getItem('admin_user');
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  onAuthStateChange(callback) {
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
};
