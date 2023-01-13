import { createSchema, createYoga } from "graphql-yoga";
import { createServer } from 'node:http'

const usuarios = [
  {
    id: "1",
    nome: "Fernanda",
    senha: "123456"
  }
]

const ambientes = [
  {
    id: "11",
    nome: "geral"
  }
]

const participacoes = [
  {
    id: "101",
    usuario: "1",
    ambiente: "11",
    entrada: "2022-12-18 00:00:00",
    saida: null
  }
]

const mensagens = [
  {
    id: "1001",
    texto: "Nosso dia",
    usuario: "1",
    ambiente: "11",
    data: '2022-12-18 18:44:00'
  }
]

const schema = createSchema({
  typeDefs: `
    type Usuario{
      id: ID!
      nome: String!
      senha: String!
      mensagens: [Mensagem!]!
      ambientes: [Ambiente!]!
    }

    type Mensagem {
      id: ID!
      texto: String!
      usuario: Usuario!
      ambiente: Ambiente!
      data: String!
    }

    type Ambiente {
      id: ID!
      nome: String!
      usuarios: [Usuario!]!
      mensagens: [Mensagem!]!
    }

    type Participacao{
      id: ID!
      usuario: Usuario!
      ambiente: Ambiente!
      entrada: String!
      saida: String
    }
    type Query{
      hello: String!
      ambientes: [Ambiente!]!
      existe (nome: String!, senha: String!): Usuario
    }
  `,
  resolvers: {
    Query: {
      hello: () => "Hello, GraphQL!",
      ambientes: () => ambientes,
      existe: (parent, args, context, info) => {
        const { nome, senha } = args
        return usuarios.find(u => u.nome === nome && u.senha === senha)
      }
    },
    Ambiente: {
      usuarios: (parent, args, context, info) => {
        const idUsuarios = participacoes.filter(p => p.ambiente === parent.id).map(p => p.usuario)
        return usuarios.filter(u => idUsuarios.includes(u.id)) 
      },
      mensagens: (parent, args, context, info) => {
        return mensagens.filter(m => m.ambiente === parent.id)  
      }  
    },
    Usuario: {
      mensagens: (parent, args, context, info) => {

      },
      ambientes: (parent, args, context, info) => {
        
      }
    }
  }
})



const yoga = createYoga({
  schema
})

const server = createServer(yoga)
const port = 4000
server.listen(port, () => {
  `Servidor disponível em http://localhost:${port}`
})