const express = require('express');
//const bodyParser = require('body-parser');
const graphqlHTTP = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const Event = require('./models/event');
const User = require('./models/users');

const app = express();

const events = [];
//app.use(bodyParser.json());
app.use(express.json());

app.use('/api', graphqlHTTP({
    schema : buildSchema(`
        type Event {
            _id : ID!
            title : String!
            description : String!
            price : Float!
            date : String!
        }

        type User {
            _id : ID!
            email : String!
            password : String
        }

        input UserInput {
            email : String!
            password : String!
        }

        input EventInput {
            title : String!
            description : String!
            price : Float!
            date : String!
        }

        type RootQuery {
            events : [Event!]!
        }

        type RootMutation {
            createEvent(eventInput : EventInput) : Event
            createUser(userInput : UserInput) : User
        }

        schema {
            query : RootQuery
            mutation : RootMutation
        }
    `),
    // Resolvers
    rootValue : {
        events : ()=>{
            // return events;
            return Event.find()
                .then(events => {
                    return events.map(event => {
                        return { ...event._doc };
                    });
                })
                .catch(err => {
                    throw err;
                });
        },
        createEvent : (arg)=>{
            
            /* const event = {
                _id : Math.random().toString(),
                title : arg.eventInput.title,
                description : arg.eventInput.description,
                price : +arg.eventInput.price,
                date : arg.eventInput.date
                //date : new Date().toISOString()
            };
            events.push(event); 
            */
            const event = new Event({
                title : arg.eventInput.title,
                description : arg.eventInput.description,
                price : +arg.eventInput.price,
                date : new Date(arg.eventInput.date),
                creator : '5d241f8022d3eb1f1c0e7788'
            });
            let createdEvent;
            return event
              .save()
              .then(result => {
                 createdEvent = {...result._doc};
                return User.findById('5d241f8022d3eb1f1c0e7788');  
              })
              .then(user => {
                  if(!user){
                      throw new Error('user does not exists');
                  }
                  user.createdEvents.push(event);
                  user.save();
              })
              .then(result => {
                 return createdEvent;
              })
              .catch(err=>{
                  console.log(err);
                  throw err;
              })
        },
        createUser : (arg)=>{
            return User.findOne({ email : arg.userInput.email })
            .then(user => {
                if(user){
                    throw new Error('user already exists.');
                }
                return bcrypt.hash(arg.userInput.password, 12)
            }) 
            .then(hashedPassword => {
                const user = new User({
                    email : arg.userInput.email,
                    password : hashedPassword
                });
                return user.save();
            })
            .then(result => {
                //console.log(result);
                return { ...result._doc, password : null};
            })
            .catch(err => {
                throw err;
            });
        }
                           
    },
    graphiql : true
}));

// Routes
// app.get('/', (req, res, next) => {
//     res.end('Hello World!');
// });

mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster0-sfg1n.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`, { useNewUrlParser: true })
.then(()=>{
    console.log('connected to mongoDB..');
})
.catch(err => {
    console.log(err);
});

const port  = process.env.PORT || 4300;
app.listen(port, ()=> {
    console.log(`App is listening on port : ${port}`);
})