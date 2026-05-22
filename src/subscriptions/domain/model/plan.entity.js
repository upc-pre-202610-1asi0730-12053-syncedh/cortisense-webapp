/**
 * @file plan.entity.js
 * @description Entidad de dominio Plan (planes de suscripción de CortiSense).
 */
export class Plan {
  #id; #name; #price; #currency; #description
  #maxStaff; #features; #tier

  constructor ({ id=null, name='', price=0, currency='S/', description='',
    maxStaff=0, features=[], tier=1 } = {}) {
    this.#id = id; this.#name = name; this.#price = price
    this.#currency = currency; this.#description = description
    this.#maxStaff = maxStaff; this.#features = features; this.#tier = tier
  }

  get id () { return this.#id }
  get name () { return this.#name }
  get price () { return this.#price }
  get currency () { return this.#currency }
  get description () { return this.#description }
  get maxStaff () { return this.#maxStaff }
  get features () { return this.#features }
  get tier () { return this.#tier }
  get priceFormatted () { return `${this.#currency} ${this.#price.toLocaleString('es-PE')}/mes` }

  toResource () {
    return { id: this.#id, name: this.#name, price: this.#price,
      currency: this.#currency, description: this.#description,
      maxStaff: this.#maxStaff, features: this.#features, tier: this.#tier }
  }
}
