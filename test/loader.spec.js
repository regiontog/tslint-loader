'use strict';

var path = require('path');
var expect = require('chai').expect;
var webpackRunner = require('./webpack-runner');

describe('TslintLoader', function() {
  it('should lint typescript files and output warning', function() {
    return webpackRunner().then(function(stats) {
      expect(stats.hasErrors()).to.be.false;
      expect(stats.hasWarnings()).to.be.true;

      var result = stats.toJson();
      expect(result.assets.length).to.eql(1);
      expect(result.chunks.length).to.eql(1);
      expect(result.warnings).to.eql([
        './test/app/engine.ts\n[8, 1]: Calls to \'console.log\' are not allowed.\n'
      ]);
    });
  });

  it('should overwrite configuration in tslint json', function() {
    return webpackRunner({
      tslint: {
        configuration: {
          rules: {
            'no-console': [false]
          }
        }
      }
    }).then(function(stats) {
      expect(stats.hasErrors()).to.be.false;
      expect(stats.hasWarnings()).to.be.false;
    });
  });

  it('should use custom tslint file when option given', function() {
    return webpackRunner({
      tslint: {
        configFile: 'tslint-custom.json'
      }
    }).then(function(stats) {
      expect(stats.hasErrors()).to.be.false;
      expect(stats.hasWarnings()).to.be.false;
    });
  });

  it('should emit linting failure as error when forced to', function() {
    return webpackRunner({
      tslint: {
        emitErrors: true
      }
    }).then(function(stats) {
      expect(stats.hasErrors()).to.be.true;
      expect(stats.hasWarnings()).to.be.false;

      var result = stats.toJson();
      expect(result.errors).to.eql([
        './test/app/engine.ts\n[8, 1]: Calls to \'console.log\' are not allowed.\n'
      ]);
    });
  });

  it('should accept options from query string also', function() {
    return webpackRunner({
      module: {
        preLoaders: [
          {
            test: /\.ts$/,
            loader: './index?emitErrors=true'
          }
        ],
        loaders: [
          {
            test: /\.ts$/,
            loader: 'awesome-typescript-loader',
            query: { forkCheckerSilent: true }
          }
        ]
      }
    }).then(function(stats) {
      expect(stats.hasErrors()).to.be.true;
      expect(stats.hasWarnings()).to.be.false;

      var result = stats.toJson();
      expect(result.errors).to.eql([
        './test/app/engine.ts\n[8, 1]: Calls to \'console.log\' are not allowed.\n'
      ]);
    });
  });

  it('should fail on linting failure when forced to', function() {
    return webpackRunner({
      tslint: {
        failOnHint: true
      }
    }).then(function(stats) {
      expect(stats.hasErrors()).to.be.true;
      expect(stats.hasWarnings()).to.be.true;

      var result = stats.toJson();
      expect(result.assets.length).to.eql(0);
      expect(result.chunks.length).to.eql(0);
      expect(result.errors[0]).to.contain('Module build failed: Error: Compilation failed due to tslint errors.');
    });
  });

  it('should use type checked rules when forced to', function() {
    return webpackRunner({
      entry: {
        engine: path.resolve(__dirname, 'app', 'for-in-array.ts')
      },
      tslint: {
        typeCheck: true,
        configuration: {
          rules: {
            'no-for-in-array': true
          }
        }
      }
    }).then(function(stats) {
      expect(stats.hasErrors()).to.be.false;
      expect(stats.hasWarnings()).to.be.true;

      var result = stats.toJson();

      expect(result.warnings).to.eql([
        './test/app/for-in-array.ts\n[4, 1]: for-in loops over arrays are forbidden. Use for-of or array.forEach instead.\n'
      ]);
    });
  });

  it('should use type checked rules also with custom tsconfig file', function() {
    return webpackRunner({
      entry: {
        engine: path.resolve(__dirname, 'app', 'for-in-array.ts')
      },
      tslint: {
        typeCheck: true,
        tsConfigFile: 'test/tsconfig.json',
        configuration: {
          rules: {
            'no-for-in-array': true
          }
        }
      }
    }).then(function(stats) {
      expect(stats.hasErrors()).to.be.false;
      expect(stats.hasWarnings()).to.be.true;

      var result = stats.toJson();

      expect(result.warnings).to.eql([
        './test/app/for-in-array.ts\n[4, 1]: for-in loops over arrays are forbidden. Use for-of or array.forEach instead.\n'
      ]);
    });
  });

  it('should use custom formatter with custom directory', function() {
    return webpackRunner({
      tslint: {
        formattersDirectory: 'test/formatters/',
        formatter: 'simple',
      }
    }).then(function(stats) {
      var result = stats.toJson();
      expect(result.warnings).to.eql([
        './test/app/engine.ts\nCalls to \'console.log\' are not allowed.\n'
      ]);
    });
  });
});
