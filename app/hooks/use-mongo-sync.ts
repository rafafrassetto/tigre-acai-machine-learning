import { useState, useEffect } from "react"

export function useMongoSync<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue)

  useEffect(() => {
    fetch(`/api/${key}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setStoredValue(data as unknown as T)
        }
      })
  }, [key])

  const setValue = (value: T | ((val: T) => T)) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value
    setStoredValue(valueToStore)

    fetch(`/api/${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(valueToStore),
    })
  }

  return [storedValue, setValue] as const
}