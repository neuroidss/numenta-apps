  /*
  * Numenta Platform for Intelligent Computing (NuPIC)
  * Copyright (C) 2015, Numenta, Inc.  Unless you have purchased from
  * Numenta, Inc. a separate commercial license for this software code, the
  * following terms and conditions apply:
  *
  * This program is free software: you can redistribute it and/or modify
  * it under the terms of the GNU General Public License version 3 as
  * published by the Free Software Foundation.
  *
  * This program is distributed in the hope that it will be useful,
  * but WITHOUT ANY WARRANTY; without even the implied warranty of
  * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
  * See the GNU General Public License for more details.
  *
  * You should have received a copy of the GNU General Public License
  * along with this program.  If not, see http://www.gnu.org/licenses.
  *
  * http://numenta.org/licenses/
  *
 */

  class Instance {
 
      var id: String!
      var name: String!
      var namespace: String!
      var location: String!
      var message: String!
      var status: Int32

    init(id: String!, name: String!, namespace: String!, location: String!, message: String!, status: Int32) {
        self.id = id
        self.name = name != nil ? name : id
        self.namespace = namespace
        self.location = location
        self.message = message
        self.status = status
    }

    func getId() -> String! {
        return self.id
    }

    func getName() -> String! {
        return self.name
    }

    func getNamespace() -> String! {
        return self.namespace
    }

    func getLocation() -> String! {
        return self.location
    }

    func getMessage() -> String! {
        return self.message
    }

    func getStatus() -> Int32 {
        return self.status
    }
}
