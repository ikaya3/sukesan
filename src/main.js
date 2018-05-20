import React from 'react';
import ReactDOM from 'react-dom';

import {BootstrapTable, TableHeaderColumn} from 'react-bootstrap-table';

var request = require('superagent');
var createReactClass = require('create-react-class');

const selectRowProp = {
  mode: 'checkbox',
  bgColor: 'pink',
};

function columnClassNameFormat(fieldValue) {
  return (fieldValue >= 200) ? 'hoge' : 'fuga';
}

var products = [{
      id: 1,
      name: "Product1",
      price: 120
  }, {
      id: 2,
      name: "Product2",
      price: 80
  }, {
      id: 3,
      name: "Product3",
      price: 800
  }];

var ExpandRow = createReactClass({
  getInitialState: function(){
    console.log("getinitialstate");
    return {
      data: [],
      range: this.getInitialRange(),
      pj_detail: {},
    };
  },

  componentDidMount: function(){
    console.log("did mount");
    console.log(this.state.range);
    console.log(this.getBordersOfDate());
    request
      .get(__AJAX_SERVER_URI + '/api/mongo_test2')
      .query({borders_of_date: this.getBordersOfDate().map((v) => v.toJSON()) })
      .end(function(err,res){
	console.log("response");
	console.log(res.body);
	this.setState({data: res.body});
      }.bind(this));
  },

  expandComponent: function(row) {
    return (
      <div className="zero-margin">
        <p>{ row._id }</p>
        <BootstrapTable data={products}>
	<TableHeaderColumn isKey dataField='id' className='hoge'>Product ID</TableHeaderColumn>
	<TableHeaderColumn dataField='name' width='15%'>Product Name</TableHeaderColumn>
	<TableHeaderColumn dataField='price' dataSort columnClassName= { columnClassNameFormat } >Product Price</TableHeaderColumn>
	</BootstrapTable>
      </div>
    );
  },

  onExpand: function(key, isExpand) {
    if(isExpand) {
      console.log(key);
      request
        .get(__AJAX_SERVER_URI + '/api/mongo_test2')
        .query({borders_of_date: this.getBordersOfDate().map((v) => v.toJSON()) })
        .end(function(err,res){
          const pj_detail_copy = this.state.pj_detail;
          pj_detail_copy[key] = res.body;
          console.log(pj_detail_copy);
          this.setState({pj_detail: pj_detail_copy});
        }.bind(this));
    }
  },

  render: function() {
    const range = this.getBordersOfDate().map(
      (v) => (('0' + (v.getMonth() + 1)).slice(-2)) + '/' + (('0' + (v.getDate())).slice(-2)))
    range.pop();

    console.log(this.state.data);
    const options = {
      expandRowBgColor: '#D9D9D9', // grey background
      onExpand: this.onExpand,
    };
    return (
      <div>
        <BootstrapTable data={this.state.data}
          options = { options }
          expandableRow  = { () => true }
          expandComponent= { this.expandComponent }>
	  <TableHeaderColumn isKey dataField='_id' className='hoge' width='15%'>Project ID</TableHeaderColumn>
	  <TableHeaderColumn dataField='name' width='20%'>Name</TableHeaderColumn>
	  {range.map( (v, i) =>
		      <TableHeaderColumn key={v} headerAlign='center' dataAlign='right' dataField={'range'+i} dataFormat={ (cell) => cell.toFixed(1) } >{v}</TableHeaderColumn>
		    )}
	  <TableHeaderColumn dataField='total' dataSort columnClassName= { columnClassNameFormat } headerAlign='center' dataAlign='right' dataFormat={ (cell) => cell.toFixed(1) } >Total</TableHeaderColumn>
	</BootstrapTable>
      </div>
    );
  },

  getInitialRange: function() {
    const INITIAL_WIDTH = 7;
    const INITIAL_COUNT = 8;

    var begin_of_date = new Date(new Date().setHours(9,0,0,0));	// TODO : ちょっとダサい
    begin_of_date.setDate(begin_of_date.getDate() - begin_of_date.getDay() - (INITIAL_WIDTH * (INITIAL_COUNT-1)));
    console.log(begin_of_date);

    return {
      begin_of_date: begin_of_date,
      width: INITIAL_WIDTH,
      count: INITIAL_COUNT,
    };
  },

  getBordersOfDate: function() {
    return Array.apply(null, {length: this.state.range.count + 1}).map((v, i) => {
      var dt = new Date(this.state.range.begin_of_date);
      dt.setDate(dt.getDate() + (i * this.state.range.width));
      return dt;
    });
  },

});

ReactDOM.render(
  <div>
    <h1>sukesan</h1>

    <ExpandRow /*data={products}*/ />

    <div className="page-header">hogehoge</div>
    <p className='fuga'>hogehoge</p>

    <BootstrapTable data={products} striped hover version="4" selectRow={ selectRowProp } condensed className="blue-font">
    <TableHeaderColumn isKey dataField='id' className='hoge'>Product ID</TableHeaderColumn>
    <TableHeaderColumn dataField='name' width='15%'>Product Name</TableHeaderColumn>
    <TableHeaderColumn dataField='price' dataSort columnClassName= { columnClassNameFormat } >Product Price</TableHeaderColumn>
    </BootstrapTable>,
  </div>,
  document.getElementById('app')
);
