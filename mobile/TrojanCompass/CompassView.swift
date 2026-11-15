import SwiftUI
import WebKit

// The embedded web client owns search, routes, chat and current selection.
// Native code never duplicates those requests or runs its own pathfinder.
struct CompassView: View {
    @State private var failure: String?
    @State private var reloadID = UUID()

    private var viewerURL: URL? {
        guard let configured = Bundle.main.object(forInfoDictionaryKey: "CompassViewerURL") as? String,
              var parts = URLComponents(string: configured),
              ["http", "https"].contains(parts.scheme?.lowercased() ?? ""),
              parts.host != nil else { return nil }
        var query = parts.queryItems ?? []
        if !query.contains(where: { $0.name == "building" }) {
            query.append(URLQueryItem(name: "building", value: "LAW"))
        }
        parts.queryItems = query
        return parts.url
    }

    var body: some View {
        VStack(spacing: 0) {
            if let failure {
                VStack(spacing: 12) {
                    Text("Map unavailable").font(.headline)
                    Text(failure).font(.subheadline).multilineTextAlignment(.center)
                    Button("Retry") { self.failure = nil; reloadID = UUID() }
                }.padding()
            }
            if let url = viewerURL {
                CompassWebView(url: url, failure: $failure)
                    .id(reloadID)
            } else {
                Text("Set COMPASS_VIEWER_URL in the Xcode build settings to your reachable viewer address.")
                    .multilineTextAlignment(.center).padding()
            }
        }
        .background(Color.white)
        .tint(Color(red: 0.6, green: 0, blue: 0))
    }
}

private struct CompassWebView: UIViewRepresentable {
    let url: URL
    @Binding var failure: String?

    func makeCoordinator() -> Coordinator { Coordinator(origin: url, failure: $failure) }
    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        let view = WKWebView(frame: .zero, configuration: configuration)
        view.navigationDelegate = context.coordinator
        view.isOpaque = false
        view.scrollView.bounces = false
        view.allowsBackForwardNavigationGestures = true
        view.load(URLRequest(url: url))
        return view
    }
    func updateUIView(_ view: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKNavigationDelegate {
        let origin: URL
        @Binding var failure: String?
        init(origin: URL, failure: Binding<String?>) {
            self.origin = origin
            self._failure = failure
        }
        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            if (error as NSError).code != NSURLErrorCancelled { failure = error.localizedDescription }
        }
        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            if (error as NSError).code != NSURLErrorCancelled { failure = error.localizedDescription }
        }
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) { failure = nil }
        func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let target = action.request.url,
                  ["http", "https"].contains(target.scheme?.lowercased() ?? "") else {
                decisionHandler(.cancel); return
            }
            if action.navigationType == .linkActivated && target.host != origin.host {
                UIApplication.shared.open(target)
                decisionHandler(.cancel)
            } else { decisionHandler(.allow) }
        }
    }
}
