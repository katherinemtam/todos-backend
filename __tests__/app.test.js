import client from '../lib/client.js';
import supertest from 'supertest';
import app from '../lib/app.js';
import { execSync } from 'child_process';

const request = supertest(app);

describe('API Routes', () => {

  afterAll(async () => {
    return client.end();
  });

  describe('/api/todos', () => {
    let user;
    let user2;

    beforeAll(async () => {
      execSync('npm run recreate-tables');

      const response = await request
        .post('/api/auth/signup')
        .send({
          name: 'Me the User',
          email: 'me@user.com',
          password: 'password'
        });

      expect(response.status).toBe(200);
      user = response.body;

      const response2 = await request
        .post('/api/auth/signup')
        .send({
          name: 'Other User',
          email: 'you@user.com',
          password: 'password'
        });

      expect(response2.status).toBe(200);
      user2 = response2.body;
    });

    let todo = {
      id: expect.any(Number),
      task: 'pet the dog',
      completed: false
    };

    // append the token to your requests:

    it('POST todo /api/todos', async () => {
      const response = await request
        .post('/api/todos')
        .set('Authorization', user.token)
        .send(todo);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ userId: user.id, ...todo });
      todo = response.body;
    });

    it('GET my /api/me/todos only returns MY todos', async () => {
      const otherTodoResponse = await request
        .post('/api/todos')
        .set('Authorization', user2.token)
        .send({
          task: 'eat bacon',
          completed: false
        });

      expect(otherTodoResponse.status).toBe(200);
      const otherTodo = otherTodoResponse.body;

      // we are testing MY todos
      const response = await request.get('/api/me/todos')
        .set('Authorization', user.token);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.not.arrayContaining([otherTodo]));

      // we are testing user2's todos
      const response2 = await request.get('/api/me/todos')
        .set('Authorization', user2.token);

      expect(response2.status).toBe(200);
      expect(response2.body).toEqual([otherTodo]);
    });

    it('PUT updated todo to /api/todos/:id', async () => {
      todo.task = 'take out the trash';
      todo.completed = true;

      const response = await request
        .put(`/api/todos/${todo.id}`)
        .set('Authorization', user.token)
        .send(todo);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(todo);
    });

    it('DELETE a todo from /api/todos/:id', async () => {
      const response = await request
        .delete(`/api/todos/${todo.id}`)
        .set('Authorization', user.token);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(todo);
    });
  });
});
