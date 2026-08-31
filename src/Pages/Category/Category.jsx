import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Category.module.css'
import { getCategories } from '../../APIs/category';

const icons = {crops:'🌾', livestock: '🐄', poultry: '🐔'}; 

export function Category(){
    const [categories, setCategories] = useState([]);
    const navigate = useNavigate();

    useEffect(()=>{
        const loadCategories = async()=>{
                try{
                    const request = await getCategories();
                    const data = request.body;
                    setCategories(data);
                }catch(err){
                    setCategories([]);
                }
            }
        loadCategories();
    }, []);

    return(
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>Categories</h2>
                <button className={styles.addBtn} onClick={()=> navigate('/categories/new')}>+ Add Category</button>
            </div>

            <main className={styles.content}>
                {categories && categories.length > 0 ? (
                    <div className={styles.cards}>
                        {categories.map((c) => (
                            <div key={c.id} className={styles.card} onClick={() =>{ navigate(`/categories/${c.id}/${c.name.toLowerCase()}`); }} role="button" tabIndex={0}>
                                <div className={styles.cardIcon}>{icons[c.name.toLowerCase()]? icons[c.name.toLowerCase()] : '📁'}</div>
                                <div className={styles.cardTitle}>{c.name.charAt(0).toUpperCase() + c.name.slice(1)}</div>
                                {c.description && <div className={styles.cardDesc}>{c.description}</div>}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.empty}>No categories available</div>
                )}
            </main>
        </div>
    )
}
