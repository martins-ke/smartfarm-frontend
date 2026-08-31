import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './CategoryForm.module.css';
import { createCategory } from '../../APIs/category';

export default function CategoryForm(){
  const [data, setData] = useState({name:'', description:''});
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!data.name.trim() || !data.description.trim()) return;
    setSubmitting(true);
    try{
      const request = await createCategory(data);
      const message = request.message;
      const success = request.success;
      if(success){
        alert(message);
        navigate('/categories');
        setData({...data, name:'', description:''});
      }
    }catch(err){
      alert(err.message);
    }finally{
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Create Category</h2>
      </div>
      <form className={styles.form} onSubmit={onSubmit}> 
        <label className={styles.field}>
          <span className={styles.label}>Name</span>
          <input value={data.name} onChange={(e)=> setData({...data, name:e.target.value})} placeholder="e.g. Crops" required />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Description</span>
          <textarea value={data.description} onChange={(e)=> setData({...data, description:e.target.value})} placeholder="Short description like category examples..." rows={3} required />
        </label>

        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={() => navigate('/categories')}>Cancel</button>
          <button type="submit" className={styles.submit} disabled={submitting}>{submitting ? 'Saving...' : 'Create Category'}</button>
        </div>
      </form>
    </div>
  );
}
