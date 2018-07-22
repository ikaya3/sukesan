const React    = require('react');
const ReactDom = require('react-dom');

const ReactBootstrap    = require('react-bootstrap');
const ButtonToolbar     = ReactBootstrap.ButtonToolbar;
const ToggleButton      = ReactBootstrap.ToggleButton;
const ToggleButtonGroup = ReactBootstrap.ToggleButtonGroup;

const ReactBootstrapTable = require('react-bootstrap-table');
const BootstrapTable      = ReactBootstrapTable.BootstrapTable;
const TableHeaderColumn   = ReactBootstrapTable.TableHeaderColumn;

const request = require('superagent');
const createReactClass = require('create-react-class');

const KEY_TYPE = {
  PJ    : 0,
  PERSON: 1,
};

const WIDTH_TYPE = {
  DAY  : 0,
  WEEK : 1,
  MONTH: 2,
};

const selectRowProp = {
  mode: 'checkbox',
  bgColor: 'pink',
};

function columnClassNameFormat(fieldValue) {
  return (fieldValue >= 200) ? 'hoge' : 'fuga';
}

var ExpandRow = createReactClass({
  getInitialState: function(){
    console.log("getinitialstate");
    return {
      data: [],
      prime_key: KEY_TYPE.PJ,
      range: this.getInitialRange(),
      pj_detail: {},
    };
  },

  componentDidMount: function(){
    console.log("did mount");
    this.requestSummary();
  },

  requestSummary: function(param = {}) {
    console.log(param);
    const range     = param.range     || this.state.range;
    const prime_key = param.prime_key || this.getPrimeKey(this.state.prime_key);
    console.log(prime_key);
    console.log(range);


    request
      .get(__AJAX_SERVER_URI + '/api/mongo_test2')
      .query({
        key: prime_key,
        borders_of_date: this.getBordersOfDate(range).map((v) => v.toJSON()),
      })
      .end(function(err,res){
        const pj_detail = {};
        console.log("response");
        console.log(res.body);
        res.body.forEach(function(document){ pj_detail[document._id] = []; });
        this.setState({data: res.body, pj_detail: pj_detail, range: range});
      }.bind(this));
  },

  expandComponent: function(row) {
    const range = this.getBordersOfDate().map(
      (v) => (('0' + (v.getMonth() + 1)).slice(-2)) + '/' + (('0' + (v.getDate())).slice(-2)))
    range.pop();

    return (
      <div className="zero-margin">
        <p>{ row.name + " / " + row._id }</p>
        <BootstrapTable data={this.state.pj_detail[row._id]}>
          <TableHeaderColumn isKey dataField='_id' className='hoge' width='15%'>Person ID</TableHeaderColumn>
          <TableHeaderColumn dataField='name' width='20%'>Name</TableHeaderColumn>
          {range.map( (v, i) =>
                      <TableHeaderColumn key={v} headerAlign='center' dataAlign='right' dataField={'range'+i} dataFormat={ (cell) => cell.toFixed(1) } >{v}</TableHeaderColumn>
                    )}
          <TableHeaderColumn dataField='total' dataSort columnClassName= { columnClassNameFormat } headerAlign='center' dataAlign='right' dataFormat={ (cell) => cell.toFixed(1) } >Total</TableHeaderColumn>
        </BootstrapTable>
      </div>
    );
  },

  onExpand: function(key, isExpand) {
    console.log(this.state.expanded);
    if(isExpand) {
      console.log(key);
      console.log(this.state.prime_key);
      request
        .get(__AJAX_SERVER_URI + '/api/mongo_test2')
        .query({
          key: this.getSecondKey(),
          pjs:     ((this.state.prime_key == KEY_TYPE.PJ) ? key : undefined),
          persons: ((this.state.prime_key != KEY_TYPE.PJ) ? key : undefined),   // TODO : 「== KEY_TYPE.PERSONS」だとうまくいかない？
          borders_of_date: this.getBordersOfDate().map((v) => v.toJSON()),
        })
        .end(function(err,res){
          const pj_detail_copy = this.state.pj_detail;
          pj_detail_copy[key] = res.body;
          console.log(pj_detail_copy);
          this.setState({pj_detail: pj_detail_copy});
        }.bind(this));
    }
  },

  onChangeRange: function(value) {
    console.log(value);
    this.requestSummary({range: this.getRange(new Date(), value, this.state.range.count)});
  },

  onChangePrimeKey: function(value) {
    console.log(value);
    this.setState({prime_key: value});
    this.requestSummary({prime_key: this.getPrimeKey(value)});
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
        <ButtonToolbar>
          <ToggleButtonGroup type="radio" name="prime_key_type" onChange={this.onChangePrimeKey} defaultValue={this.state.prime_key}>
            <ToggleButton value={KEY_TYPE.PJ}    >project</ToggleButton>
            <ToggleButton value={KEY_TYPE.PERSON}>person</ToggleButton>
          </ToggleButtonGroup>
        </ButtonToolbar>
        <ButtonToolbar>
          <ToggleButtonGroup type="radio" name="width_type" onChange={this.onChangeRange} defaultValue={WIDTH_TYPE.WEEK}>
            <ToggleButton value={WIDTH_TYPE.DAY}  >day</ToggleButton>
            <ToggleButton value={WIDTH_TYPE.WEEK} >week</ToggleButton>
            <ToggleButton value={WIDTH_TYPE.MONTH}>month</ToggleButton>
          </ToggleButtonGroup>
        </ButtonToolbar>
    
        <BootstrapTable data={this.state.data}
          version="4" hover striped condensed
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

  getPrimeKey: function(prime_key) {
    return (prime_key === KEY_TYPE.PJ) ? "pj" : "person";
  },

  getSecondKey: function() {
    return (this.state.prime_key === KEY_TYPE.PJ) ? "person" : "pj";
  },

  getRange: function(date_target, width_type, count) {
    var begin_of_date = new Date(date_target.setHours(9,0,0,0));        // TODO : ちょっとダサい
    switch(width_type){
      case WIDTH_TYPE.DAY:
        begin_of_date.setDate(begin_of_date.getDate() - (count-1));
        break;
      case WIDTH_TYPE.WEEK:
        begin_of_date.setDate(begin_of_date.getDate() - begin_of_date.getDay() - (7 * (count-1)));
        break;
      case WIDTH_TYPE.MONTH:
      default:
        begin_of_date.setDate(1);
        begin_of_date.setMonth(begin_of_date.getMonth() - (count-1));
        break;
    }

    console.log(begin_of_date);

    return {
      width_type: width_type,
      begin_of_date: begin_of_date,
      count: count,
    };
  },

  getInitialRange: function() {
    const INITIAL_COUNT = 8;
    return this.getRange(new Date(), WIDTH_TYPE.WEEK, INITIAL_COUNT);
  },

  getBordersOfDate: function(range) {
    range = range || this.state.range;
    return Array.apply(null, {length: range.count + 1}).map((v, i) => {
      var dt = new Date(range.begin_of_date);
      switch(range.width_type){
        case WIDTH_TYPE.DAY:
          dt.setDate(dt.getDate() + i);
          break;
        case WIDTH_TYPE.WEEK:
          dt.setDate(dt.getDate() + (i * 7));
          break;
        case WIDTH_TYPE.MONTH:
        default:
          dt.setDate(1);
          dt.setMonth(dt.getMonth() + i);
          break;
      }
      return dt;
    });
  },

});

ReactDom.render(
  <div>
    <h1>sukesan</h1>

    <ExpandRow/>

  {/*
    <div className="page-header">hogehoge</div>
    <p className='fuga'>hogehoge</p>

    <BootstrapTable data={products} striped hover version="4" selectRow={ selectRowProp } condensed className="blue-font">
    <TableHeaderColumn isKey dataField='id' className='hoge'>Product ID</TableHeaderColumn>
    <TableHeaderColumn dataField='name' width='15%'>Product Name</TableHeaderColumn>
    <TableHeaderColumn dataField='price' dataSort columnClassName= { columnClassNameFormat } >Product Price</TableHeaderColumn>
    </BootstrapTable>,
   */}

  </div>,
  document.getElementById('app')
);
