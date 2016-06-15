REPORTER = dot
BIN = ./node_modules/.bin/

test:
	$(BIN)mocha --reporter $(REPORTER) --compilers js:babel-register tests

cover:
	$(BIN)babel-node $(BIN)isparta cover --reporter html $(BIN)_mocha -- --reporter $(REPORTER) tests

watch:
	$(BIN)npm-watch
