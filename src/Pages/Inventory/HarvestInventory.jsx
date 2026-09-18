import { useState, useEffect } from "react";
import { getHarvestInventory } from "../../APIs/harvest";
import { Spinner } from "../../Components/Spinner/Spinner";
import { ErrorState } from "../../Components/ErrorState/ErrorState";
import styles from './InventoryPage.module.css';
import { formatHarvestStock } from '../../utils/units';

export function HarvestInventory() {
    const [harvest, setHarvest] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [heading, setHeading] = useState('');

    const loadHarvest = async () => {
        setLoading(true);
        setError(null);
        try {
            const request = await getHarvestInventory();
            setHeading(request?.message || '');
            setHarvest(request?.body || []);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadHarvest();
    }, []);

    if (loading) return <Spinner label="Loading harvest stock..." />;

    if (error) return (
        <ErrorState
            error={error}
            title="Could Not Load Harvest Stock"
            onRetry={loadHarvest}
        />
    );

    if (harvest.length === 0) return (
        <div className={styles.loading}>
            No harvest stock recorded yet. Harvest produce from a project to see it here.
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {heading && <h2>{heading}</h2>}
            <div className={styles.inventoryGrid}>
                {harvest.map(item => (
                    <div key={item.id} className={styles.inventoryCard}>
                        <div className={styles.cardTopRow}>
                            <h3>{item.item_name || item.itemName}</h3>
                            <span className={styles.categoryBadge}>{item.projectName}</span>
                        </div>
                        <div className={styles.stockInfo}>
                            <div className={styles.stockRow}>
                                <span>Available Stock</span>
                                <span className={styles.stockValue}>
                                    {formatHarvestStock(item)}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}