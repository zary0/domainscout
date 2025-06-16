import requests
import socket
import ssl
import time
from typing import Dict, List, Optional, Tuple
from urllib.parse import urlparse
import dns.resolver
from agent.tools_and_schemas import DomainInfo, SecurityAnalysis, DomainValueAnalysis


def extract_domain_from_query(query: str) -> List[str]:
    """Extract domain names from user query"""
    import re
    
    # Simple domain extraction pattern that works with Japanese text
    # First try to extract .jp domains (including co.jp, ne.jp, or.jp)
    jp_pattern = r'([a-zA-Z0-9][a-zA-Z0-9\-]*\.(?:co\.jp|ne\.jp|or\.jp|jp))'
    other_pattern = r'([a-zA-Z0-9][a-zA-Z0-9\-]*\.(?:com|org|net|io|ai|app|edu|gov))'
    
    # Extract domains using both patterns
    jp_matches = re.findall(jp_pattern, query, re.IGNORECASE)
    other_matches = re.findall(other_pattern, query, re.IGNORECASE)
    
    if jp_matches:
        print(f"[DEBUG] JP pattern found domains: {jp_matches}")
    if other_matches:
        print(f"[DEBUG] Other pattern found domains: {other_matches}")
    
    domains = jp_matches + other_matches
    print(f"[DEBUG] Total domains found: {domains}")
    
    # Clean and validate domains
    clean_domains = []
    for domain in domains:
        # Remove any non-ASCII characters and normalize
        clean_domain = ''.join(char for char in domain if ord(char) < 128).strip().lower()
        
        # Remove any characters that aren't alphanumeric, dots, or hyphens
        clean_domain = re.sub(r'[^a-zA-Z0-9\.-]', '', clean_domain)
        
        # Validate the cleaned domain
        if (clean_domain and 
            len(clean_domain) >= 5 and  # Minimum: x.xx
            clean_domain.count('.') >= 1 and  # At least one dot
            not clean_domain.startswith('.') and 
            not clean_domain.endswith('.') and
            not clean_domain.startswith('-') and
            not clean_domain.endswith('-')):
            
            # Further validation - check that it has a proper structure
            parts = clean_domain.split('.')
            if len(parts) >= 2 and all(len(part) >= 1 for part in parts):
                # Check that domain name and TLD are reasonable lengths
                domain_name = '.'.join(parts[:-1])
                tld = parts[-1]
                if len(domain_name) >= 1 and len(tld) >= 2:
                    clean_domains.append(clean_domain)
    
    # Remove duplicates while preserving order
    seen = set()
    unique_domains = []
    for domain in clean_domains:
        if domain not in seen:
            seen.add(domain)
            unique_domains.append(domain)
    
    print(f"[DEBUG] Regex extracted domains from '{query[:100]}...': {unique_domains}")
    return unique_domains


def check_domain_availability(domain: str) -> bool:
    """Check if domain is available by trying to resolve it"""
    try:
        socket.gethostbyname(domain)
        return False  # Domain exists, not available
    except socket.gaierror:
        return True   # Domain doesn't resolve, might be available


def get_whois_info_via_search(domain: str) -> Optional[str]:
    """Get WHOIS information using python-whois-extended library"""
    try:
        import whois
        
        # Perform WHOIS query
        query_result = whois.query(domain)
        
        if not query_result:
            return None
        
        # Build WHOIS information string
        whois_info = []
        
        if hasattr(query_result, 'status') and query_result.status:
            whois_info.append(f"Status: {query_result.status}")
        
        if hasattr(query_result, 'creation_date') and query_result.creation_date:
            whois_info.append(f"作成日: {query_result.creation_date}")
        
        if hasattr(query_result, 'expiration_date') and query_result.expiration_date:
            whois_info.append(f"有効期限: {query_result.expiration_date}")
        
        if hasattr(query_result, 'last_updated') and query_result.last_updated:
            whois_info.append(f"最終更新日: {query_result.last_updated}")
        
        if hasattr(query_result, 'registrar') and query_result.registrar:
            whois_info.append(f"レジストラ: {query_result.registrar}")
        
        if hasattr(query_result, 'name_servers') and query_result.name_servers:
            if isinstance(query_result.name_servers, set):
                ns_list = list(query_result.name_servers)
            elif isinstance(query_result.name_servers, list):
                ns_list = query_result.name_servers
            else:
                ns_list = [str(query_result.name_servers)]
            whois_info.append(f"ネームサーバー: {', '.join(ns_list)}")
        
        if hasattr(query_result, 'registrant') and query_result.registrant:
            whois_info.append(f"登録者: {query_result.registrant}")
        
        if hasattr(query_result, 'registrant_country') and query_result.registrant_country:
            whois_info.append(f"国: {query_result.registrant_country}")
        
        return " | ".join(whois_info) if whois_info else "WHOIS情報を取得できませんでした"
        
    except Exception as e:
        # WHOISが利用できない場合はNoneを返す
        print(f"[DEBUG] WHOIS lookup failed for {domain}: {str(e)}")
        return None


def get_dns_records(domain: str) -> Dict[str, List[str]]:
    """Get DNS records for domain"""
    records = {}
    record_types = ['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME']
    
    for record_type in record_types:
        try:
            answers = dns.resolver.resolve(domain, record_type)
            records[record_type] = [str(answer) for answer in answers]
        except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer, Exception):
            records[record_type] = []
    
    return records


def check_http_status(domain: str) -> Tuple[Optional[int], Optional[float]]:
    """Check HTTP status and response time"""
    try:
        start_time = time.time()
        response = requests.get(f"http://{domain}", timeout=10, allow_redirects=True)
        response_time = time.time() - start_time
        return response.status_code, response_time
    except requests.RequestException:
        try:
            start_time = time.time()
            response = requests.get(f"https://{domain}", timeout=10, allow_redirects=True)
            response_time = time.time() - start_time
            return response.status_code, response_time
        except requests.RequestException:
            return None, None


def check_ssl_certificate(domain: str) -> bool:
    """Check SSL certificate validity"""
    try:
        context = ssl.create_default_context()
        with socket.create_connection((domain, 443), timeout=10) as sock:
            with context.wrap_socket(sock, server_hostname=domain) as ssock:
                cert = ssock.getpeercert()
                return cert is not None
    except Exception:
        return False


def analyze_domain_info(domain: str) -> DomainInfo:
    """Analyze basic domain information"""
    is_available = check_domain_availability(domain)
    whois_data = get_whois_info_via_search(domain) if not is_available else None
    dns_records = get_dns_records(domain) if not is_available else None
    
    http_status = None
    response_time = None
    ssl_valid = None
    
    if not is_available:
        http_status, response_time = check_http_status(domain)
        ssl_valid = check_ssl_certificate(domain)
    
    return DomainInfo(
        domain=domain,
        is_available=is_available,
        whois_data=whois_data,
        dns_records=dns_records,
        http_status=http_status,
        ssl_valid=ssl_valid,
        response_time=response_time
    )


def analyze_security_via_search(domain: str) -> SecurityAnalysis:
    """Analyze security through web search results"""
    # This would use web search to check:
    # - Blacklist status
    # - Malware reports
    # - Phishing reports
    # - Reputation scores
    
    # For demo purposes, return safe defaults
    return SecurityAnalysis(
        domain=domain,
        is_blacklisted=False,
        malware_detected=False,
        phishing_risk=False,
        reputation_score=75.0  # Default safe score
    )


def analyze_domain_value_via_search(domain: str) -> DomainValueAnalysis:
    """Analyze domain value through web search results"""
    # This would use web search to find:
    # - Traffic estimates from sites like SimilarWeb
    # - SEO scores from various tools
    # - Domain age from WHOIS
    # - Estimated value from domain appraisal sites
    
    # For demo purposes, return placeholder values
    return DomainValueAnalysis(
        domain=domain,
        estimated_traffic=None,
        seo_score=None,
        domain_age=None,
        estimated_value=None
    )


def calculate_overall_score(domain_info: DomainInfo, security: SecurityAnalysis, value: DomainValueAnalysis) -> float:
    """Calculate overall domain usability score"""
    score = 0.0
    
    # Availability check (40% weight)
    if domain_info.is_available:
        score += 40.0
    elif domain_info.http_status == 200:
        score += 20.0
    
    # Security check (30% weight)
    if not security.is_blacklisted:
        score += 10.0
    if not security.malware_detected:
        score += 10.0
    if not security.phishing_risk:
        score += 10.0
    
    # Technical check (20% weight)
    if domain_info.ssl_valid:
        score += 10.0
    if domain_info.response_time and domain_info.response_time < 2.0:
        score += 10.0
    
    # Value check (10% weight)
    if security.reputation_score and security.reputation_score > 70:
        score += 10.0
    
    return min(100.0, score)


def get_usability_status(score: float) -> str:
    """Get usability status based on score"""
    if score >= 80:
        return "excellent"
    elif score >= 60:
        return "good"
    elif score >= 40:
        return "fair"
    elif score >= 20:
        return "poor"
    else:
        return "unavailable"


def generate_recommendations(domain_info: DomainInfo, security: SecurityAnalysis, score: float) -> List[str]:
    """Generate recommendations based on analysis"""
    recommendations = []
    
    if domain_info.is_available:
        recommendations.append("ドメインは登録可能です")
        recommendations.append("登録前に商標の競合をチェックしてください")
    else:
        if domain_info.http_status != 200:
            recommendations.append("ウェブサイトが応答していません - 一時的にダウンしている可能性があります")
        if not domain_info.ssl_valid:
            recommendations.append("SSL証明書の問題が検出されました")
        if domain_info.response_time and domain_info.response_time > 3.0:
            recommendations.append("レスポンス時間が遅く、ユーザー体験に影響する可能性があります")
    
    if security.reputation_score and security.reputation_score < 50:
        recommendations.append("評判スコアが低いため、さらなる調査が必要です")
    
    if score < 50:
        recommendations.append("代替ドメインの検討をお勧めします")
    
    return recommendations


def identify_risks(domain_info: DomainInfo, security: SecurityAnalysis) -> List[str]:
    """Identify potential risks"""
    risks = []
    
    if security.is_blacklisted:
        risks.append("ドメインがブラックリストに登録されています")
    if security.malware_detected:
        risks.append("マルウェアが検出されました")
    if security.phishing_risk:
        risks.append("フィッシングリスクの可能性があります")
    if not domain_info.ssl_valid and not domain_info.is_available:
        risks.append("有効なSSL証明書がありません")
    if domain_info.response_time and domain_info.response_time > 5.0:
        risks.append("レスポンス時間が非常に遅いです")
    
    return risks