all: dev


clean:
	@rm -rf build
	@rm -f Tailwind.elm || true


dev: clean
	@npx etc Sheet.css \
		--config tailwind.config.js \
		--elm-path Tailwind.elm \
		--output build/sheet.css \
		\
		--post-plugin-before postcss-import \
		--post-plugin-after postcss-nested

	@elm make App.elm --output build/app.js


prod: clean
	@NODE_ENV=production npx etc Sheet.css \
		--config tailwind.config.js \
		--elm-path Tailwind.elm \
		--output build/sheet.css \
		\
		--post-plugin-before postcss-import \
		--post-plugin-after postcss-nested \
		\
		--purge-content ./build/app.js \
		--purge-content ./App.html

	@elm make App.elm --output build/app.js

	# Check if build output is correct
	@cat build/sheet.css
