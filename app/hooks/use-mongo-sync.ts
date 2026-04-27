import { useState, useEffect } from "react"

export function useMongoSync<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue)

  useEffect(() => {
    fetch(`/api/${key}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setStoredValue(data as unknown as T)
        }
      })
      .catch(err => console.error("Erro ao sincronizar do Mongo:", err))
  }, [key])

  const setValue = (value: T | ((val: T) => T)) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value
    setStoredValue(valueToStore)

    fetch(`/api/${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(valueToStore),
    }).catch(err => console.error("Erro ao salvar no Mongo:", err))
  }

  return [storedValue, setValue] as const
}