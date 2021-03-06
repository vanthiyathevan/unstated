// @flow
import React from 'react';
import renderer from 'react-test-renderer';
import { Provider, Subscribe, Container, useUnstated } from '../src/unstated';

function render(element) {
  return renderer.create(element).toJSON();
}

async function click({ children = [] }, id) {
  const el: any = children.find(({ props = {} }) => props.id === id);
  el.props.onClick();
}

class CounterContainer extends Container<{ count: number }> {
  state = { count: 0 };
  increment(amount = 1) {
    this.setState({ count: this.state.count + amount });
  }
  decrement(amount = 1) {
    this.setState({ count: this.state.count - amount });
  }
}

function Counter() {
  return (
    <Subscribe to={[CounterContainer]}>
      {counter => (
        <div>
          <span>{counter.state.count}</span>
          <button id="decrement" onClick={() => counter.decrement()}>
            -
          </button>
          <button id="increment" onClick={() => counter.increment()}>
            +
          </button>
        </div>
      )}
    </Subscribe>
  );
}

function CounterWithUse() {
  const [counter] = useUnstated(CounterContainer);
  return (
    <div>
      <span>{counter.state.count}</span>
      <button id="decrement" onClick={() => counter.decrement()}>
        -
      </button>
      <button id="increment" onClick={() => counter.increment()}>
        +
      </button>
    </div>
  );
}

test('should incresase/decrease state counter in container', async () => {
  let counter = new CounterContainer();
  let tree = render(
    <Provider inject={[counter]}>
      <Counter />
    </Provider>
  );
  expect(counter.state.count).toBe(0);

  await click(tree, 'increment');
  expect(counter.state.count).toBe(1);

  await click(tree, 'decrement');
  expect(counter.state.count).toBe(0);
});

test('should incresase/decrease state counter in container using useUnstated', async () => {
  let counter = new CounterContainer();
  let tree = render(
    <Provider inject={[counter]}>
      <CounterWithUse />
    </Provider>
  );
  expect(counter.state.count).toBe(0);

  await click(tree, 'increment');
  expect(counter.state.count).toBe(1);

  await click(tree, 'decrement');
  expect(counter.state.count).toBe(0);
});

test('should remove subscriber listeners if component is unmounted', () => {
  let counter = new CounterContainer();
  let tree = renderer.create(
    <Provider inject={[counter]}>
      <Counter />
    </Provider>
  );
  expect(counter._listeners.length).toBe(1);

  tree.unmount();

  expect(counter._listeners.length).toBe(0);
});

test('should remove subscriber listeners if component is unmounted with useUnstated', () => {
  let counter = new CounterContainer();
  let tree = renderer.create(
    <Provider inject={[counter]}>
      <CounterWithUse />
    </Provider>
  );
  expect(() => tree.root.findByType(CounterWithUse)).not.toThrow();
  expect(counter._listeners.length).toBe(1);

  tree.unmount();
  expect(() => tree.root.findByType(CounterWithUse)).toThrowError(
    "Can't access .root on unmounted test renderer"
  );
  expect(counter._listeners.length).toBe(0);
});

test('should throw an error if <Subscribe> component is not wrapper with <Provider>', () => {
  spyOn(console, 'error');
  expect(() => render(<Counter />)).toThrowError(
    'You must wrap your hook component with a <Provider>'
  );
});

test('should throw an error if component using useUnstated is not wrapper with <Provider>', () => {
  spyOn(console, 'error');
  expect(() => render(<CounterWithUse />)).toThrowError(
    'You must wrap your hook component with a <Provider>'
  );
});
