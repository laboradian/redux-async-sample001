import '../../node_modules/bootstrap-sass/assets/javascripts/bootstrap.js';
import 'babel-polyfill'
import _ from 'lodash'
import React from 'react'
import { render } from 'react-dom'
import { Provider, connect } from 'react-redux'
import { createStore, combineReducers, applyMiddleware } from 'redux'
import thunkMiddleware from 'redux-thunk'
import { createLogger } from 'redux-logger'
import PropTypes from 'prop-types'
import classNames from 'classnames';

const loggerMiddleware = createLogger()

// index.html ファイルをコピーする
require('file-loader?name=../../dist/[name].[ext]!../index.html');


//-----------------------------------
// Action creators (Actionを返す)
//-----------------------------------

const FETCHING_START = 'FETCHING_START';
const FETCHING_END = 'FETCHING_END';
const FETCH_DATA_DONE = 'FETCH_DATA_DONE';
const FETCH_ERROR = 'FETCH_ERROR';

const startFetching = () => {
  return {
    type: FETCHING_START
  }
}
const endFetching = () => {
  return {
    type: FETCHING_END
  }
}
const errorFetching = (message) => {
  return {
    type: FETCH_ERROR,
    message
  }
}

const receiveObject = (resultJson) => {
  return {
    type: FETCH_DATA_DONE,
    resultJson
  }
};

// Async action function

const fetchObject = () => {
  return (dispatch) => {

    dispatch(startFetching());

    return fetch('http://misc.laboradian.com/php-json-api/?t=1&s=3')
      .then(
        (response) => {
          return response.json(); // Promiseを返している
        },
        (error) => {
          dispatch(endFetching());
          dispatch(errorFetching(error.message));
        }
      )
      .then(
        // catch を使ってはいけないため、error 発生時でもここを通る。
        (json) => {
          if (!_.isEmpty(json)) {
            dispatch(endFetching());
            dispatch(receiveObject(json[0]));
          }
        }
      );
  };
}

//-----------------------------------
// Reducer
//-----------------------------------

const fetching = (state = false, action) => {
  switch (action.type) {
    case FETCHING_START:
      return true;
    case FETCHING_END:
      return false;
    default:
      return state
  }
}
const resultJson = (state = {}, action) => {
  switch (action.type) {
    case FETCH_DATA_DONE:
      return action.resultJson;
    case FETCHING_START:
      return {}
    default:
      return state
  }
}
const errorObject = (state = { error: false, message: '' }, action) => {
  switch (action.type) {
    case FETCH_ERROR:
      return Object.assign({}, state, { error: true, message: action.message });
    default:
      return Object.assign({}, {error: false, message: ''});
  }
}

//-----------------------------------
// Component
//-----------------------------------

class AppComponent extends React.Component {
  //constructor(props) {
  //  super(props);
  //}

  render() {
    const { fetching, resultJson, errorObject } = this.props
    return (
      <div>
        <div className="panel panel-success">
          <div className="panel-heading">fetch</div>
          <div className="panel-body">
            <button type="button"
              onClick={this.props.clickToGetData}>データを取得する（非同期）</button>
            <output>
              <h5>取得したデータ：</h5>
              <i className={classNames('fa', 'fa-spinner', 'fa-spin', 'fa-3x', 'fa-fw', {'hidden': !fetching})}></i>
              {!_.isEmpty(resultJson) &&
                <div>
                {resultJson.name}, {resultJson.age}
                </div>
              }
              {errorObject.error &&
                <div className="alert alert-danger" role="alert">{errorObject.message}</div>
              }
            </output>
          </div>
        </div>

      </div>
    );
  }
}

AppComponent.propTypes = {
  errorObject: PropTypes.object,
  fetching: PropTypes.bool.isRequired,
  resultJson: PropTypes.object,
  clickToGetData: PropTypes.func.isRequired
};

//-----------------------------------
// Container
//-----------------------------------

const AppContainer = (() => {

  const mapStateToProps = (state/*, ownProps*/) => {
    return state;
  }

  const mapDispatchToProps = (dispatch) => {
    return {
      clickToGetData() {
        dispatch(startFetching());
        dispatch(fetchObject());
      }
    }
  }

  return connect(
    mapStateToProps,
    mapDispatchToProps
  )(AppComponent);

})();

//-----------------------------------
// Store
//-----------------------------------

const store = createStore(
  combineReducers({fetching, resultJson, errorObject}),
  applyMiddleware(
    thunkMiddleware,
    loggerMiddleware
  )
)

//-----------------------------------
// 画面に表示する
//-----------------------------------

render(
  <Provider store={store}>
    <AppContainer />
  </Provider>,
  document.getElementById('root')
)
