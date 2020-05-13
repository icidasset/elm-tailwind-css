all:
	@rm -rf build
	@rm Tailwind.elm

	@npx etc Sheet.css \
		--config tailwind.config.js \
		--elm-path Tailwind.elm \
		--output build/sheet.css

	@elm make App.elm --output build/app.js

	@NODE_ENV=production npx etc Sheet.css \
		--config tailwind.config.js \
		--output build/sheet.css \
		--purge-content ./build/app.js

	# Check if build output is correct
	@cat build/sheet.css
