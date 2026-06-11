import { http } from './http.js'

export class BaseEndpoint {
  constructor (resourcePath) {
    this.resourcePath = resourcePath
  }

  getAll (params = {}) { return http.get(this.resourcePath, { params }) }
  getById (id) { return http.get(`${this.resourcePath}/${id}`) }
  create (payload) { return http.post(this.resourcePath, payload) }
  update (id, payload) { return http.put(`${this.resourcePath}/${id}`, payload) }
  patch (id, payload) { return http.patch(`${this.resourcePath}/${id}`, payload) }
  delete (id) { return http.delete(`${this.resourcePath}/${id}`) }
}
