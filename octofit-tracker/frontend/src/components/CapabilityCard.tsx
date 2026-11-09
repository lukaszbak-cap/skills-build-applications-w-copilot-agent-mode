import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Props<T> = {
  title: string;
  description: string;
  endpoint: string;
  resourceKey: string;
  emptyText: string;
  renderItem: (item: T, index: number) => React.ReactNode;
};

export function CapabilityCard<T>({ title, description, endpoint, resourceKey, emptyText, renderItem }: Props<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const payload = await getJson<Record<string, unknown>>(endpoint);
        const nextItems = Array.isArray((payload as Record<string, unknown>)[resourceKey])
          ? ((payload as Record<string, unknown>)[resourceKey] as T[])
          : [];

        if (active) {
          setItems(nextItems);
        }
      } catch (caughtError) {
        if (active) {
          setError(`Unable to load ${title.toLowerCase()}.`);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [endpoint, resourceKey, title]);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>

        {loading && <p role="status">Loading...</p>}
        {!loading && error && <p role="alert">{error}</p>}
        {!loading && !error && items.length === 0 && <p>{emptyText}</p>}
        {!loading && !error && items.length > 0 && (
          <ul className="list-unstyled mb-0">
            {items.map((item, index) => <li key={index}>{renderItem(item, index)}</li>)}
          </ul>
        )}
      </div>
    </section>
  );
}
