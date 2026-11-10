import axios from 'axios';
import React, { Component } from 'react';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = { message: 'Loading...' };
  }

  render() {
    return (
      <div>
        <h2>Admin page</h2>
        <p>{this.state.message}</p>
      </div>
    );
  }

  componentDidMount() {
    axios.get('/hello').then((res) => {
      this.setState({ message: res.data.message });
    });
  }
}

export default App;
