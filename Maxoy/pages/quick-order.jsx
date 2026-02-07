import React, { useEffect, useState } from 'react'
import { useStateContext } from '../context/StateContext'
import { formatPrice, getPriceForMode } from '../lib/productUtils'
import { t } from '../constants/i18n'

const QuickOrderPage = () => {
  const { onAdd, language, currency, pricingMode } = useStateContext()
  const [products, setProducts] = useState([])
  const [sku, setSku] = useState('')
  const [qty, setQty] = useState(1)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/store/products')
      .then((res) => res.json())
      .then((data) => setProducts(data?.products || []))
      .catch(() => setProducts([]))
  }, [])

  const handleAdd = () => {
    const cleaned = sku.trim().toLowerCase()
    if (!cleaned) return
    const product = products.find((p) =>
      String(p.sku || p.code || '').toLowerCase() === cleaned
    )
    if (!product) {
      setError(t(language, 'quickOrder.skuNotFound'))
      return
    }
    onAdd(product, Number(qty) || 1)
    setError('')
    setSku('')
    setQty(1)
  }

  return (
    <div className="container" style={{ marginTop: '10rem' }}>
      <h1 style={{ fontSize: '4rem', marginBottom: '2rem' }}>{t(language, 'nav.quickOrder')}</h1>
      <p style={{ fontSize: '1.6rem', color: '#666' }}>
        {t(language, 'quickOrder.instructions')}
      </p>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder={t(language, 'product.sku')}
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          style={{ padding: '1rem', minWidth: '200px' }}
        />
        <input
          type="number"
          min="1"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          aria-label={t(language, 'quickOrder.qtyLabel')}
          style={{ padding: '1rem', width: '120px' }}
        />
        <button
          type="button"
          onClick={handleAdd}
          style={{ padding: '1rem 2rem', background: '#377c57', color: '#fff', border: 'none', borderRadius: '6px' }}
        >
          {t(language, 'actions.addToCart')}
        </button>
      </div>
      {error && <p style={{ color: 'crimson', marginTop: '1rem' }}>{error}</p>}

      <div style={{ marginTop: '3rem' }}>
        <h2 style={{ fontSize: '2.4rem', marginBottom: '1rem' }}>
          {t(language, 'quickOrder.listTitle')}
        </h2>
        <div style={{ display: 'grid', gap: '0.6rem' }}>
          {products.map((product) => (
            <div
              key={product.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid #eee',
                padding: '1rem',
                borderRadius: '8px',
              }}
            >
              <div>
                <strong>{product.sku || product.code}</strong> - {product.nameTR || product.name}
              </div>
              <div>{formatPrice(getPriceForMode(product, pricingMode), currency, language)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default QuickOrderPage
